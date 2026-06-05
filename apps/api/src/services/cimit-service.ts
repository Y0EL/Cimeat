import OpenAI from 'openai'
import {
  cimitPersonaSystem,
  composeSystemPrompt,
  dailyAdviceTask,
  offsideRoastTask,
} from '@cimeat/prompts'
import { and, desc, eq, lt } from 'drizzle-orm'
import { cimitMessages, type CimitMessage, type Database } from '@cimeat/db'
import type { cimitMessageTypeSchema } from '@cimeat/types'
import { type CimitTone } from '@cimeat/types'
import type { z as zType } from 'zod'

type CimitMessageType = zType.infer<typeof cimitMessageTypeSchema>
import { getDb } from '../db'
import { logger } from '../logger'
import { generateText, getOpenAI } from './ai-orchestrator'
import { getActiveGoal } from './goal-service'
import { getDailySummary } from './daily-summary-service'
import { mealTypeByClock } from './food-analysis-shared'
import { deleteFoodLog, insertFoodLog, recentFoodLogs } from './foodlog-service'
import { ensureSafe } from './safety-service'

const MAX_TOOL_HOPS = 6

const CIMIT_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'catat_makanan',
      description: 'Catat satu makanan yang dimakan user beserta estimasi kalori dan makro.',
      parameters: {
        type: 'object',
        properties: {
          foodName: { type: 'string', description: 'Nama makanan.' },
          mealType: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            description: 'Waktu makan. Kosongin kalau gak jelas.',
          },
          calories: { type: 'number', description: 'Estimasi kalori (kkal).' },
          proteinG: { type: 'number', description: 'Protein gram.' },
          carbsG: { type: 'number', description: 'Karbohidrat gram.' },
          fatG: { type: 'number', description: 'Lemak gram.' },
        },
        required: ['foodName', 'calories'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lihat_ringkasan_hari',
      description: 'Lihat ringkasan kalori dan makro yang dikonsumsi hari ini vs target.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lihat_makanan_terakhir',
      description: 'Lihat beberapa makanan terakhir yang dicatat user.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Berapa makanan terakhir, default 5.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hapus_makanan_terakhir',
      description: 'Hapus catatan makanan paling terakhir.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

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

  const text = await generateText({
    systemInstruction: composeSystemPrompt(dailyAdviceTask, { includePersona: true, tone }),
    parts: [{ type: 'text', text: context }],
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

  const text = await generateText({
    systemInstruction: composeSystemPrompt(offsideRoastTask, { includePersona: true, tone }),
    parts: [{ type: 'text', text: context }],
  })
  const safe = await ensureSafe(text)
  await saveCimitMessages(db, userId, 'roast', [{ role: 'model', content: safe, tone }]).catch(
    (err) => logger.warn({ err }, 'save roast failed'),
  )
  return safe
}

export async function chatStream(
  userId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  tone: CimitTone,
  onChunk: (text: string) => void,
): Promise<string> {
  const db = getDb()

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: cimitPersonaSystem(tone) },
    ...history.map((m): OpenAI.ChatCompletionMessageParam => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  let accText = ''

  for (let hop = 0; hop < MAX_TOOL_HOPS; hop += 1) {
    const stream = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: CIMIT_TOOLS,
      stream: true,
    })

    let chunkText = ''
    const toolChunks: Record<number, { id: string; name: string; args: string }> = {}

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (delta?.content) {
        chunkText += delta.content
        onChunk(delta.content)
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          if (!toolChunks[idx]) toolChunks[idx] = { id: '', name: '', args: '' }
          if (tc.id) toolChunks[idx].id = tc.id
          if (tc.function?.name) toolChunks[idx].name += tc.function.name
          if (tc.function?.arguments) toolChunks[idx].args += tc.function.arguments
        }
      }
    }

    accText += chunkText
    const pendingTools = Object.values(toolChunks)

    if (pendingTools.length === 0) break

    messages.push({
      role: 'assistant',
      content: chunkText || null,
      tool_calls: pendingTools.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.args },
      })),
    })

    for (const tc of pendingTools) {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.args)
      } catch {}
      const out = await runToolCall(db, userId, tc.name, args, 'manual')
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(out),
      })
    }
  }

  return accText || 'Oke, udah gue catat ya.'
}

const channelHistories = new Map<string, OpenAI.ChatCompletionMessageParam[]>()
const HISTORY_CAP = 20

export async function chatTextTurn(turn: {
  conversationId: string
  userId: string
  source: MealSource
  tone: CimitTone
  text: string
}): Promise<string> {
  const db = getDb()

  const history = channelHistories.get(turn.conversationId) ?? []
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: cimitPersonaSystem(turn.tone) },
    ...history,
    { role: 'user', content: turn.text },
  ]

  for (let hop = 0; hop < MAX_TOOL_HOPS; hop += 1) {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: CIMIT_TOOLS,
    })

    const choice = response.choices[0]
    if (!choice) break
    messages.push(choice.message)

    if (!choice.message.tool_calls?.length) break

    for (const tc of choice.message.tool_calls) {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments)
      } catch {}
      const out = await runToolCall(db, turn.userId, tc.function.name, args, turn.source)
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(out),
      })
    }
  }

  const text = (messages[messages.length - 1] as OpenAI.ChatCompletionAssistantMessageParam)
    .content as string

  const trimmed = messages
    .slice(1)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-HISTORY_CAP)
  channelHistories.set(turn.conversationId, trimmed)

  return text?.trim() || 'Oke, udah gue catat ya.'
}
