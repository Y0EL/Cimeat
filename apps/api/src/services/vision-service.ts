import { analyzeImageTask, composeSystemPrompt } from '@cimeat/prompts'
import {
  analyzeImageResponseSchema,
  type AnalyzeImageRequest,
  type AnalyzeImageResponse,
  type CimitTone,
  type FoodAnalysis,
} from '@cimeat/types'
import type { Database, FoodLog } from '@cimeat/db'
import { generateJson } from './ai-orchestrator'
import { foodAnalysisToLogValues, saveAnalysisLog } from './food-analysis-shared'
import { uploadBase64 } from './storage-service'

export async function analyzeImage(
  db: Database,
  userId: string,
  input: AnalyzeImageRequest,
  tone: CimitTone,
): Promise<{ analysis: AnalyzeImageResponse; log: FoodLog | null }> {
  const analysis = await generateJson<AnalyzeImageResponse>({
    systemInstruction: composeSystemPrompt(analyzeImageTask, {
      includePersona: true,
      tone,
    }),
    parts: [
      { type: 'image', mimeType: input.mimeType, data: input.image },
      { type: 'text', text: 'Analisis foto makanan ini.' },
    ],
    schema: analyzeImageResponseSchema,
    label: 'vision',
  })

  let log: FoodLog | null = null
  if (input.saveMode === 'save') {
    const imageUrl = await uploadBase64(input.image, input.mimeType, 'images')
    log = await saveAnalysisLog(db, userId, {
      analysis: analysis as FoodAnalysis,
      source: 'vision',
      mealType: input.mealType,
      imageUrl,
    })
  }
  return { analysis, log }
}

export { foodAnalysisToLogValues }
