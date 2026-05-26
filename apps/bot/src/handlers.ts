import { downloadMediaMessage, type WAMessage, type WASocket } from '@whiskeysockets/baileys'
import { GoogleGenAI } from '@google/genai'
import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { pino } from 'pino'
import { buildMealReply, parseQuickAddText, type ParsedFoodEntry } from '@cimeat/chat-core'
import { foodVisionPrompt } from '@cimeat/prompts'
import type { createDatabase } from '@cimeat/db'
import { channelLinks, linkingCodes, meals, nutritionGoals } from '@cimeat/db'
import type { MealType, ValidFoodCategory } from '@cimeat/types'

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })

type DB = ReturnType<typeof createDatabase>

// Rough kkal estimate per serving when the user does not state calories.
const CATEGORY_CALORIE_ESTIMATE: Record<ValidFoodCategory, number> = {
  protein: 250,
  vegetable: 80,
  fruit: 90,
  grain: 350,
  dairy: 150,
  fastfood: 500,
  beverage: 120,
  snack: 200,
  other: 250,
}

function normalizeJid(jid: string): string {
  const base = jid.split('@')[0]?.split(':')[0] ?? jid
  return `${base}@s.whatsapp.net`
}

function defaultMealTypeByHour(date: Date): MealType {
  const hour = date.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

async function resolveUserId(db: DB, jid: string): Promise<string | null> {
  const rows = await db
    .select({ userId: channelLinks.userId })
    .from(channelLinks)
    .where(
      and(eq(channelLinks.channel, 'whatsapp'), eq(channelLinks.externalId, normalizeJid(jid))),
    )
    .limit(1)
  return rows[0]?.userId ?? null
}

// Returns remaining calories for today if the user has an active goal, else undefined.
async function getRemainingCalories(
  db: DB,
  userId: string,
  now: Date,
  justLogged: number,
): Promise<number | undefined> {
  const goalRows = await db
    .select({ calorieGoal: nutritionGoals.calorieGoal })
    .from(nutritionGoals)
    .where(eq(nutritionGoals.userId, userId))
    .orderBy(desc(nutritionGoals.startsAt))
    .limit(1)

  const goal = goalRows[0]?.calorieGoal
  if (typeof goal !== 'number') return undefined

  const mealRows = await db
    .select({ calories: meals.calories })
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        gte(meals.loggedAt, startOfDay(now)),
        lte(meals.loggedAt, endOfDay(now)),
      ),
    )

  const loggedTotal = mealRows.reduce((sum, row) => sum + (row.calories ?? 0), 0)
  // justLogged is already part of mealRows since we insert before computing,
  // so do not double count it here.
  void justLogged
  return goal - loggedTotal
}

export async function handleLink(
  db: DB,
  socket: WASocket,
  msg: WAMessage,
  code: string,
): Promise<void> {
  const jid = msg.key.remoteJid ?? ''
  const normalized = normalizeJid(jid)
  const now = new Date()

  const rows = await db
    .select({
      userId: linkingCodes.userId,
      expiresAt: linkingCodes.expiresAt,
      usedAt: linkingCodes.usedAt,
    })
    .from(linkingCodes)
    .where(eq(linkingCodes.code, code.toUpperCase()))
    .limit(1)

  const row = rows[0]
  if (!row || row.usedAt || row.expiresAt < now) {
    await socket.sendMessage(jid, {
      text: 'Kode tidak valid atau sudah kadaluarsa. Generate ulang dari app Cimeat ya.',
    })
    return
  }

  await db
    .insert(channelLinks)
    .values({ userId: row.userId, channel: 'whatsapp', externalId: normalized })
    .onConflictDoUpdate({
      target: [channelLinks.channel, channelLinks.externalId],
      set: { userId: row.userId },
    })

  await db
    .update(linkingCodes)
    .set({ usedAt: now })
    .where(eq(linkingCodes.code, code.toUpperCase()))

  await socket.sendMessage(jid, {
    text: [
      'Mantap, akun lo udah tersambung ke Cimeat.',
      '',
      'Sekarang tinggal ngabarin makanan lo. Contoh:',
      '  nasi goreng 600 kkal',
      '  makan siang ayam bakar 450 kkal',
      '',
      'Atau kirim foto makanan, nanti gue hitung kalorinya otomatis.',
    ].join('\n'),
  })
}

export async function handleText(
  db: DB,
  socket: WASocket,
  msg: WAMessage,
  text: string,
): Promise<void> {
  const jid = msg.key.remoteJid ?? ''
  const userId = await resolveUserId(db, jid)

  if (!userId) {
    await socket.sendMessage(jid, {
      text: 'Akun lo belum tersambung ke Cimeat. Buka app, masuk Pengaturan, pilih Sambungin WhatsApp, lalu kirim kode ke sini:\n  link KODEMU',
    })
    return
  }

  const parsed: ParsedFoodEntry | null = parseQuickAddText(text)
  if (!parsed) {
    await socket.sendMessage(jid, {
      text: 'Belum nangkep makanannya. Coba: "nasi goreng 600 kkal" atau "ayam bakar 450 kkal".',
    })
    return
  }

  let calories = parsed.calories
  let estimated = false
  if (calories === null || calories <= 0) {
    calories = CATEGORY_CALORIE_ESTIMATE[parsed.category]
    estimated = true
  }

  const now = new Date()
  const mealType = parsed.mealType ?? defaultMealTypeByHour(now)

  await db.insert(meals).values({
    userId,
    mealType,
    name: parsed.name,
    servings: 1,
    calories,
    loggedAt: now,
    source: 'whatsapp',
  })

  const remainingCalories = await getRemainingCalories(db, userId, now, calories)

  let reply = buildMealReply({
    name: parsed.name,
    calories,
    ...(typeof remainingCalories === 'number' ? { remainingCalories } : {}),
  })
  if (estimated) {
    reply += '\n\n(Itu estimasi ya. Sebutin kkal-nya biar lebih akurat, contoh "nasi goreng 600 kkal".)'
  }

  await socket.sendMessage(jid, { text: reply })
}

type FoodVisionItem = {
  name?: string
  category?: string
  servingLabel?: string
  calories?: number
  protein?: number
  carb?: number
  fat?: number
}

type FoodVisionResult = {
  items?: FoodVisionItem[]
  totalCalories?: number
  confidence?: 'high' | 'medium' | 'low'
}

export async function handlePhoto(
  db: DB,
  socket: WASocket,
  msg: WAMessage,
  geminiKey: string,
): Promise<void> {
  const jid = msg.key.remoteJid ?? ''
  const userId = await resolveUserId(db, jid)

  if (!userId) {
    await socket.sendMessage(jid, {
      text: 'Akun lo belum tersambung. Sambungin dulu dari app Cimeat.',
    })
    return
  }

  await socket.sendMessage(jid, { text: 'Sebentar, lagi ngitung kalorinya...' })

  try {
    const raw = await downloadMediaMessage(msg, 'buffer', {})
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer)
    const base64 = buf.toString('base64')

    const ai = new GoogleGenAI({ apiKey: geminiKey })
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: foodVisionPrompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
          ],
        },
      ],
    })

    const rawText = result.text?.trim() ?? ''
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('invalid json response')

    const parsed = JSON.parse(match[0]) as FoodVisionResult
    const items = Array.isArray(parsed.items) ? parsed.items : []
    const totalCalories =
      typeof parsed.totalCalories === 'number' && parsed.totalCalories > 0
        ? Math.round(parsed.totalCalories)
        : items.reduce((sum, it) => sum + (Number(it.calories) || 0), 0)

    if (items.length === 0 || totalCalories <= 0) {
      await socket.sendMessage(jid, {
        text: 'Fotonya kurang jelas atau bukan makanan, coba foto ulang ya.',
      })
      return
    }

    const name = items.map((it) => String(it.name ?? '')).filter(Boolean).join(', ') || 'makanan'
    const protein = items.reduce((sum, it) => sum + (Number(it.protein) || 0), 0)
    const carb = items.reduce((sum, it) => sum + (Number(it.carb) || 0), 0)
    const fat = items.reduce((sum, it) => sum + (Number(it.fat) || 0), 0)
    const confidence = parsed.confidence ?? 'medium'

    const now = new Date()
    const mealType = defaultMealTypeByHour(now)

    await db.insert(meals).values({
      userId,
      mealType,
      name,
      servings: 1,
      calories: totalCalories,
      protein,
      carb,
      fat,
      loggedAt: now,
      source: 'photo',
      photoConfidence: confidence,
      rawPayload: parsed,
    })

    const remainingCalories = await getRemainingCalories(db, userId, now, totalCalories)

    await socket.sendMessage(jid, {
      text: buildMealReply({
        name,
        calories: totalCalories,
        ...(typeof remainingCalories === 'number' ? { remainingCalories } : {}),
      }),
    })
  } catch (err) {
    logger.error({ err, userId }, 'photo handler gagal')
    await socket.sendMessage(jid, { text: 'Gagal baca foto makanannya, coba foto ulang.' })
  }
}
