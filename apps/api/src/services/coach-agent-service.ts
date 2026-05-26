import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'
import { coachSystemPrompt } from '@cimeat/prompts'
import type { Database } from '@cimeat/db'
import { getDb } from '../db'
import { loadEnv } from '../env'
import { logger } from '../logger'
import { saveAgentMeal, type AgentMealInput } from './chat-meal-service'
import { deleteMeal, recentMeals } from './meal-service'
import { getActiveGoal } from './goal-service'
import { getDailySummary } from './meal-service'

const MAX_TOOL_HOPS = 6

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'catat_makanan',
    description: 'Catat satu makanan yang dimakan user beserta estimasi kalori dan makro.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: 'Nama makanan.' },
        mealType: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Waktu makan. Kosongin kalau gak jelas.',
        },
        calories: { type: SchemaType.NUMBER, description: 'Estimasi kalori (kkal).' },
        protein: { type: SchemaType.NUMBER, description: 'Protein gram.' },
        carb: { type: SchemaType.NUMBER, description: 'Karbohidrat gram.' },
        fat: { type: SchemaType.NUMBER, description: 'Lemak gram.' },
        servings: { type: SchemaType.NUMBER, description: 'Jumlah porsi, default 1.' },
      },
      required: ['name', 'calories'],
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

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

type MealSource = 'mobile' | 'telegram' | 'whatsapp' | 'photo' | 'chat' | 'manual' | 'recipe'

async function runToolCall(
  db: Database,
  userId: string,
  name: string,
  args: Record<string, unknown>,
  source: MealSource = 'chat',
): Promise<object> {
  switch (name) {
    case 'catat_makanan': {
      const saved = await saveAgentMeal(db, userId, args as unknown as AgentMealInput, source)
      return { ok: true, tercatat: saved }
    }
    case 'lihat_ringkasan_hari': {
      const goal = await getActiveGoal(db, userId)
      const summary = await getDailySummary(db, userId, today(), goal)
      return { ok: true, ringkasan: summary }
    }
    case 'lihat_makanan_terakhir': {
      const limit = typeof args.limit === 'number' ? Math.min(Math.max(args.limit, 1), 20) : 5
      const rows = await recentMeals(db, userId, limit)
      return {
        ok: true,
        makanan: rows.map((r) => ({
          nama: r.name,
          kalori: r.calories,
          waktu_makan: r.mealType,
          tanggal: r.loggedAt.toISOString().slice(0, 10),
        })),
      }
    }
    case 'hapus_makanan_terakhir': {
      const rows = await recentMeals(db, userId, 1)
      const last = rows[0]
      if (!last) return { ok: false, alasan: 'belum ada makanan dicatat' }
      await deleteMeal(db, userId, last.id)
      return { ok: true, dihapus: { nama: last.name, kalori: last.calories } }
    }
    default:
      return { ok: false, alasan: 'tool gak dikenal' }
  }
}

const channelHistories = new Map<string, Content[]>()
const HISTORY_CAP = 20

/**
 * Non-streaming coach turn for channel bots (Telegram/WhatsApp). Keeps a short
 * in-memory history per conversation and logs meals via function calling.
 */
export async function runCoachTextTurn(turn: {
  conversationId: string
  userId: string
  source: MealSource
  parts: Part[]
}): Promise<string> {
  const db = getDb()
  const env = loadEnv()

  const model = getGenAI().getGenerativeModel({
    model: env.GEMINI_MODEL_CHAT,
    systemInstruction: coachSystemPrompt,
    tools: [{ functionDeclarations }],
  })

  const chat = model.startChat({ history: channelHistories.get(turn.conversationId) ?? [] })

  try {
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
      .map((c) => ({
        role: c.role,
        parts: c.parts.map((p): Part => ('inlineData' in p && p.inlineData ? { text: '[media]' } : p)),
      }))
      .slice(-HISTORY_CAP)
    channelHistories.set(turn.conversationId, cleaned)
    return text.length > 0 ? text : 'Oke, udah gue catat ya.'
  } catch (err) {
    logger.error({ err, conversationId: turn.conversationId }, 'coach text turn failed')
    throw err
  }
}

export async function runCoachChatTurn(
  userId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
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
    systemInstruction: coachSystemPrompt,
    tools: [{ functionDeclarations }],
  })

  const chat = model.startChat({ history: contentHistory })

  try {
    const streamResult = await chat.sendMessageStream(message)

    let accText = ''
    let hasToolCall = false

    for await (const chunk of streamResult.stream) {
      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        if ('text' in part && part.text) {
          accText += part.text
          onChunk(part.text)
        }
        if ('functionCall' in part && part.functionCall) {
          hasToolCall = true
        }
      }
    }

    if (!hasToolCall) {
      return accText || 'Hmm gue gak nangkep, coba ulangin?'
    }

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
        )
        responseParts.push({ functionResponse: { name: call.name, response: out } })
      }
      const next = await chat.sendMessage(responseParts)
      currentResponse = next.response
    }

    const finalText = currentResponse.text().trim()
    if (finalText) onChunk(finalText)
    return finalText || accText || 'Oke, udah gue catat ya.'
  } catch (err) {
    logger.error({ err, userId }, 'coach chat turn failed')
    throw err
  }
}
