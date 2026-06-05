import { analyzeTextTask, composeSystemPrompt } from '@cimeat/prompts'
import {
  foodAnalysisSchema,
  type AnalyzeTextRequest,
  type CimitTone,
  type FoodAnalysis,
} from '@cimeat/types'
import type { Database, FoodLog } from '@cimeat/db'
import { generateJson } from './ai-orchestrator'
import { saveAnalysisLog } from './food-analysis-shared'

export async function analyzeText(
  db: Database,
  userId: string,
  input: AnalyzeTextRequest,
  tone: CimitTone,
): Promise<{ analysis: FoodAnalysis; log: FoodLog | null }> {
  const analysis = await generateJson<FoodAnalysis>({
    systemInstruction: composeSystemPrompt(analyzeTextTask, {
      includePersona: true,
      tone,
    }),
    parts: [{ type: 'text', text: input.text }],
    schema: foodAnalysisSchema,
    label: 'text',
  })

  let log: FoodLog | null = null
  if (input.saveMode === 'save') {
    log = await saveAnalysisLog(db, userId, {
      analysis,
      source: 'text',
      mealType: input.mealType,
      note: input.text,
    })
  }
  return { analysis, log }
}
