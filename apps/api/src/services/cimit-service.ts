import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'
import {
  cimitPersonaSystem,
  composeSystemPrompt,
  dailyAdviceTask,
  offsideRoastTask,
} from '@cimeat/prompts'
import { and, desc, eq, lt } from 'drizzle-orm'
import { cimitMessages, type CimitMessage, type Database } from '@cimeat/db'
import type { cimitMessageTypeSchema} from '@cimeat/types'
import { type CimitTone } from '@cimeat/types'
import type { z as zType } from 'zod'

type CimitMessageType = zType.infer<typeof cimitMessageTypeSchema>
import { getDb } from '../db'
import { loadEnv } from '../env'
import { logger } from '../logger'
import { generateText } from './ai-orchestrator'
import { getActiveGoal } from './goal-service'
import { getDailySummary } from './daily-summary-service'
import { mealTypeByClock } from './food-analysis-shared'
import { deleteFoodLog, insertFoodLog, recentFoodLogs } from './foodlog-service'
import { ensureSafe } from './safety-service'

const MAX_TOOL_HOPS = 6

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function saveCimitMessages(
  db: Database,
  userId: string,
  type: CimitMessageType,
  messages: Array<{ role: 'user' | 'model'; content: string; tone?: CimitTone; audioUrl?: string }>,
): Promise<void> {
  if (messages.length === 0) return
  await db.insert(cimitMessages).values(
    messages.map((m) => ({
      userId,
      type,
      role: m.role,
      content: m.content,
      tone: m.tone ?? null,
      audioUrl: m.audioUrl ?? null,
    })),
  )
}

export async function getCimitHistory(
  db: Database,
  userId: string,
  limit: number,
  before?: Date,
): Promise<CimitMessage[]> {
  const conds = [eq(cimitMessages.userId, userId)]
  if (before) conds.push(lt(cimitMessages.createdAt, before))
  const rows = await db
    .select()
    .from(cimitMessages)
    .where(and(...conds))
    .orderBy(desc(cimitMessages.createdAt))
    .limit(limit)
  return rows.reverse()
}

export async function dailyAdvice(
  db: Database,
  userId: string,
  tone: CimitTone,
  date: string = today(),
): Promise<string> {
  const goal = await getActiveGoal(db, userId)
  const summary = await getDailySummary(db, userId, date, goal)
  const recent = await recentFoodLogs(db, userId, 5)

  const context = [
    `Target kalori: ${goal.calorieGoal}. Masuk: ${summary.consumed.calories}. Sisa: ${summary.remaining.calories}.`,
    `Protein masuk: ${summary.consumed.protein}g dari target ${goal.proteinGoal}g.`,
    `Makanan terakhir: ${recent.map((r) => r.foodName).join(', ') || 'belum ada'}.`,
  ].join('\n')

  const env = loadEnv()
  const text = await generateText({
    model: env.GEMINI_MODEL_CHAT,
    systemInstruction: composeSystemPrompt(dailyAdviceTask, { includePersona: true, tone }),
    parts: [{ text: context }],
  })
  const safe = await ensureSafe(text)
  await saveCimitMessages(db, userId, 'advice', [{ role: 'model', content: safe, tone }]).catch(
    (err) => logger.warn({ err }, 'save advice failed'),
  )
  return safe
}

export async function roast(
  db: Database,
  userId: string,
  tone: CimitTone,
  date: string = today(),
): Promise<string> {
  const goal = await getActiveGoal(db, userId)
  const summary = await getDailySummary(db, userId, date, goal)

  const context = [
    `Target kalori: ${goal.calorieGoal}. Masuk: ${summary.consumed.calories}.`,
    `Offside (kelebihan): ${summary.offsideAmount} kkal.`,
  ].join('\n')

  const env = loadEnv()
  const text = await generateText({
    model: env.GEMINI_MODEL_CHAT,
    systemInstruction: composeSystemPrompt(offsideRoastTask, { includePersona: true, tone }),
    parts: [{ text: context }],
  })
  const safe = await ensureSafe(text)
  await saveCimitMessages(db, userId, 'roast', [{ role: 'model', content: safe, tone }]).catch(
    (err) => logger.warn({ err }, 'save roast failed'),
  )
  return safe
}

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'catat_makanan',
    description: 'Catat satu makanan yang dimakan user beserta estimasi kalori dan makro.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        foodName: { type: SchemaType.STRING, description: 'Nama makanan.' },
        mealType: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Waktu makan. Kosongin kalau gak jelas.',
        },
        calories: { type: SchemaType.NUMBER, description: 'Estimasi kalori (kkal).' },
        proteinG: { type: SchemaType.NUMBER, description: 'Protein gram.' },
        carbsG: { type: SchemaType.NUMBER, description: 'Karbohidrat gram.' },
        fatG: { type: SchemaType.NUMBER, description: 'Lemak gram.' },
      },
      required: ['foodName', 'calories'],
    },
  },
  {
    name: 'lihat_ringkasan_hari',
    description: 'Lihat ringkasan kalori dan makro yang dikonsumsi hari ini vs target.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'lihat_makanan_terakhir',
    description: 'Lihat beberapa makanan terakhir yang dicatat user.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: { type: SchemaType.NUMBER, description: 'Berapa makanan terakhir, default 5.' },
      },
    },
  },
  {
    name: 'hapus_makanan_terakhir',
    description: 'Hapus catatan makanan paling terakhir.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
]

type MealSource = 'telegram' | 'whatsapp' | 'manual'

async function runToolCall(
  db: Database,
  userId: string,
  name: string,
  args: Record<string, unknown>,
  source: MealSource,
): Promise<object> {
  switch (name) {
    case 'catat_makanan': {
      const mealType =
        args.mealType === 'breakfast' ||
        args.mealType === 'lunch' ||
        args.mealType === 'dinner' ||
        args.mealType === 'snack'
          ? args.mealType
          : mealTypeByClock()
      const log = await insertFoodLog(db, userId, {
        source: source === 'manual' ? 'text' : source,
        mealType,
        foodName: String(args.foodName ?? 'Makanan'),
        calories: Math.max(0, Math.round(Number(args.calories) || 0)),
        proteinG: Math.max(0, Number(args.proteinG) || 0),
        carbsG: Math.max(0, Number(args.carbsG) || 0),
        fatG: Math.max(0, Number(args.fatG) || 0),
        eatenAt: new Date(),
      })
      return { ok: true, tercatat: { nama: log.foodName, kalori: log.calories } }
    }
    case 'lihat_ringkasan_hari': {
      const goal = await getActiveGoal(db, userId)
      const summary = await getDailySummary(db, userId, today(), goal)
      return { ok: true, ringkasan: summary }
    }
    case 'lihat_makanan_terakhir': {
      const limit = typeof args.limit === 'number' ? Math.min(Math.max(args.limit, 1), 20) : 5
      const rows = await recentFoodLogs(db, userId, limit)
      return {
        ok: true,
        makanan: rows.map((r) => ({
          nama: r.foodName,
          kalori: r.calories,
          waktu_makan: r.mealType,
          tanggal: r.eatenAt.toISOString().slice(0, 10),
        })),
      }
    }
    case 'hapus_makanan_terakhir': {
      const rows = await recentFoodLogs(db, userId, 1)
      const last = rows[0]
      if (!last) return { ok: false, alasan: 'belum ada makanan dicatat' }
      await deleteFoodLog(db, userId, last.id)
      return { ok: true, dihapus: { nama: last.foodName, kalori: last.calories } }
    }
    default:
      return { ok: false, alasan: 'tool gak dikenal' }
  }
}

export async function chatStream(
  userId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  tone: CimitTone,
  onChunk: (text: string) => void,
): Promise<string> {
  const db = getDb()
  const env = loadEnv()

  const contentHistory: Content[] = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const model = getGenAI().getGenerativeModel({
    model: env.GEMINI_MODEL_CHAT,
    systemInstruction: cimitPersonaSystem(tone),
    tools: [{ functionDeclarations }],
  })

  const chat = model.startChat({ history: contentHistory })
  const streamResult = await chat.sendMessageStream(message)

  let accText = ''
  let hasToolCall = false
  for await (const chunk of streamResult.stream) {
    for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
      if ('text' in part && part.text) {
        accText += part.text
        onChunk(part.text)
      }
      if ('functionCall' in part && part.functionCall) hasToolCall = true
    }
  }

  if (!hasToolCall) return accText || 'Hmm gue gak nangkep, coba ulangin?'

  let currentResponse = await streamResult.response
  for (let hop = 0; hop < MAX_TOOL_HOPS; hop += 1) {
    const calls = currentResponse.functionCalls()
    if (!calls?.length) {
      const text = currentResponse.text().trim()
      if (text) onChunk(text)
      return text || accText || 'Oke, udah gue catat ya.'
    }
    const responseParts: Part[] = []
    for (const call of calls) {
      const out = await runToolCall(
        db,
        userId,
        call.name,
        (call.args ?? {}) as Record<string, unknown>,
        'manual',
      )
      responseParts.push({ functionResponse: { name: call.name, response: out } })
    }
    const next = await chat.sendMessage(responseParts)
    currentResponse = next.response
  }

  const finalText = currentResponse.text().trim()
  if (finalText) onChunk(finalText)
  return finalText || accText || 'Oke, udah gue catat ya.'
}

const channelHistories = new Map<string, Content[]>()
const HISTORY_CAP = 20

export async function chatTextTurn(turn: {
  conversationId: string
  userId: string
  source: MealSource
  tone: CimitTone
  parts: Part[]
}): Promise<string> {
  const db = getDb()
  const env = loadEnv()

  const model = getGenAI().getGenerativeModel({
    model: env.GEMINI_MODEL_CHAT,
    systemInstruction: cimitPersonaSystem(turn.tone),
    tools: [{ functionDeclarations }],
  })

  const chat = model.startChat({ history: channelHistories.get(turn.conversationId) ?? [] })

  let result = await chat.sendMessage(turn.parts)
  for (let hop = 0; hop < MAX_TOOL_HOPS; hop += 1) {
    const calls = result.response.functionCalls()
    if (!calls || calls.length === 0) break
    const responseParts: Part[] = []
    for (const call of calls) {
      const out = await runToolCall(
        db,
        turn.userId,
        call.name,
        (call.args ?? {}) as Record<string, unknown>,
        turn.source,
      )
      responseParts.push({ functionResponse: { name: call.name, response: out } })
    }
    result = await chat.sendMessage(responseParts)
  }

  const text = result.response.text().trim()
  const cleaned = (await chat.getHistory())
    .map((cnt) => ({
      role: cnt.role,
      parts: cnt.parts.map((p): Part =>
        'inlineData' in p && p.inlineData ? { text: '[media]' } : p,
      ),
    }))
    .slice(-HISTORY_CAP)
  channelHistories.set(turn.conversationId, cleaned)
  return text.length > 0 ? text : 'Oke, udah gue catat ya.'
}
