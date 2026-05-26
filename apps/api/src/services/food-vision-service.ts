import { GoogleGenerativeAI } from '@google/generative-ai'
import { foodVisionPrompt } from '@cimeat/prompts'
import { foodScanResponseSchema, type FoodScanResponse } from '@cimeat/types'
import { loadEnv } from '../env'
import { logger } from '../logger'

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

function stripFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

const EMPTY: FoodScanResponse = { items: [], totalCalories: 0, confidence: 'low' }

export async function scanFood(image: string, mimeType: string): Promise<FoodScanResponse> {
  const env = loadEnv()
  const model = getGenAI().getGenerativeModel({
    model: env.GEMINI_MODEL_VISION,
    generationConfig: { responseMimeType: 'application/json' },
  })

  const result = await model.generateContent([
    { inlineData: { mimeType, data: image } },
    { text: foodVisionPrompt },
  ])

  let parsed: unknown
  try {
    parsed = JSON.parse(stripFence(result.response.text()))
  } catch (err) {
    logger.error({ err }, 'food vision parse failed')
    return EMPTY
  }

  const validated = foodScanResponseSchema.safeParse(parsed)
  if (!validated.success) {
    logger.warn({ issues: validated.error.issues }, 'food vision response failed validation')
    return EMPTY
  }
  return validated.data
}
