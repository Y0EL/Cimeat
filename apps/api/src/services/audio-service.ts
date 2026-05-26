import { analyzeAudioTask, composeSystemPrompt } from '@cimeat/prompts'
import {
  analyzeAudioResponseSchema,
  type AnalyzeAudioRequest,
  type AnalyzeAudioResponse,
  type CimitTone,
  type FoodAnalysis,
} from '@cimeat/types'
import type { Database, FoodLog } from '@cimeat/db'
import { loadEnv } from '../env'
import { generateJson } from './ai-orchestrator'
import { saveAnalysisLog } from './food-analysis-shared'
import { uploadBase64 } from './storage-service'

export async function analyzeAudio(
  db: Database,
  userId: string,
  input: AnalyzeAudioRequest,
  tone: CimitTone,
): Promise<{ analysis: AnalyzeAudioResponse; log: FoodLog | null }> {
  const env = loadEnv()
  const analysis = await generateJson<AnalyzeAudioResponse>({
    model: env.GEMINI_MODEL_AUDIO,
    systemInstruction: composeSystemPrompt(analyzeAudioTask, {
      includePersona: true,
      tone,
    }),
    parts: [
      { inlineData: { mimeType: input.mimeType, data: input.audio } },
      { text: 'Transkrip lalu estimasi makanannya.' },
    ],
    schema: analyzeAudioResponseSchema,
    label: 'audio',
  })

  let log: FoodLog | null = null
  if (input.saveMode === 'save') {
    const audioUrl = await uploadBase64(input.audio, input.mimeType, 'audio')
    log = await saveAnalysisLog(db, userId, {
      analysis: analysis as FoodAnalysis,
      source: 'audio',
      audioUrl,
      note: analysis.transcript,
    })
  }
  return { analysis, log }
}
