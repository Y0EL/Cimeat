import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'
import { recipeSystemPrompt } from '@cimeat/prompts'
import { loadEnv } from '../env'
import { logger } from '../logger'

const MAX_HOPS = 6

export type RecipeIngredient = {
  name: string
  calories: number
  protein: number
  carb: number
  fat: number
}

export type RecipeResult = {
  ingredients: RecipeIngredient[]
  servings: number
  total: { calories: number; protein: number; carb: number; fat: number }
  perServing: { calories: number; protein: number; carb: number; fat: number }
}

const recipeDeclaration: FunctionDeclaration = {
  name: 'hitung_resep',
  description:
    'Hitung total kalori dan makro resep lalu bagi per porsi. Panggil setelah semua bahan + jumlah porsi terkumpul.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      ingredients: {
        type: SchemaType.ARRAY,
        description: 'Daftar bahan dengan estimasi gizi per takaran yang disebut user.',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'Nama bahan beserta takaran.' },
            calories: { type: SchemaType.NUMBER, description: 'Kalori bahan (kkal).' },
            protein: { type: SchemaType.NUMBER, description: 'Protein gram.' },
            carb: { type: SchemaType.NUMBER, description: 'Karbohidrat gram.' },
            fat: { type: SchemaType.NUMBER, description: 'Lemak gram.' },
          },
          required: ['name', 'calories', 'protein', 'carb', 'fat'],
        },
      },
      servings: { type: SchemaType.NUMBER, description: 'Resep jadi berapa porsi.' },
    },
    required: ['ingredients', 'servings'],
  },
}

function calcRecipe(ingredients: RecipeIngredient[], servings: number): RecipeResult {
  const safeServings = servings > 0 ? servings : 1
  const total = ingredients.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.calories || 0),
      protein: acc.protein + (it.protein || 0),
      carb: acc.carb + (it.carb || 0),
      fat: acc.fat + (it.fat || 0),
    }),
    { calories: 0, protein: 0, carb: 0, fat: 0 },
  )
  return {
    ingredients,
    servings: safeServings,
    total: {
      calories: Math.round(total.calories),
      protein: Math.round(total.protein * 10) / 10,
      carb: Math.round(total.carb * 10) / 10,
      fat: Math.round(total.fat * 10) / 10,
    },
    perServing: {
      calories: Math.round(total.calories / safeServings),
      protein: Math.round((total.protein / safeServings) * 10) / 10,
      carb: Math.round((total.carb / safeServings) * 10) / 10,
      fat: Math.round((total.fat / safeServings) * 10) / 10,
    },
  }
}

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

export async function runRecipeTurn(
  message: string,
  history: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  onResult: (result: RecipeResult) => void,
): Promise<string> {
  const env = loadEnv()
  const contentHistory: Content[] = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const model = getGenAI().getGenerativeModel({
    model: env.GEMINI_MODEL_CHAT,
    systemInstruction: recipeSystemPrompt,
    tools: [{ functionDeclarations: [recipeDeclaration] }],
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

    if (!hasToolCall) return accText || 'Hmm, coba ulangin?'

    let currentResponse = await streamResult.response

    for (let hop = 0; hop < MAX_HOPS; hop += 1) {
      const calls = currentResponse.functionCalls()
      if (!calls?.length) {
        const text = currentResponse.text().trim()
        if (text) onChunk(text)
        return text || accText || 'Hmm, coba ulangin?'
      }

      const responseParts: Part[] = []
      for (const call of calls) {
        if (call.name === 'hitung_resep') {
          const args = call.args as { ingredients?: RecipeIngredient[]; servings?: number }
          const result = calcRecipe(args.ingredients ?? [], args.servings ?? 1)
          onResult(result)
          responseParts.push({
            functionResponse: { name: call.name, response: { ok: true, ...result } },
          })
        } else {
          responseParts.push({
            functionResponse: { name: call.name, response: { ok: false } },
          })
        }
      }

      const next = await chat.sendMessage(responseParts)
      currentResponse = next.response
    }

    const finalText = currentResponse.text().trim()
    if (finalText) onChunk(finalText)
    return finalText || accText || 'Hmm, coba ulangin?'
  } catch (err) {
    logger.error({ err }, 'recipe turn failed')
    throw err
  }
}
