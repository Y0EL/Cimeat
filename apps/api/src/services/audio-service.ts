import { analyzeTextTask, composeSystemPrompt } from '@cimeat/prompts'
import {
  analyzeAudioResponseSchema,
  type AnalyzeAudioRequest,
  type AnalyzeAudioResponse,
  type CimitTone,
  type FoodAnalysis,
} from '@cimeat/types'
import type { Database, FoodLog } from '@cimeat/db'
import { generateJson, whisperTranscribe } from './ai-orchestrator'
import { saveAnalysisLog } from './food-analysis-shared'
import { uploadBase64 } from './storage-service'

export async function analyzeAudio(
  db: Database,
  userId: string,
  input: AnalyzeAudioRequest,
  tone: CimitTone,
): Promise<{ analysis: AnalyzeAudioResponse; log: FoodLog | null }> {
  const transcript = await whisperTranscribe(input.audio, input.mimeType)

  const base = await generateJson<FoodAnalysis>({
    systemInstruction: composeSystemPrompt(analyzeTextTask, {
      includePersona: true,
      tone,
    }),
    parts: [{ type: 'text', text: transcript }],
    schema: analyzeAudioResponseSchema.omit({ transcript: true, draft_id: true }),
    label: 'audio',
  })

  const analysis: AnalyzeAudioResponse = { ...base, transcript }

  let log: FoodLog | null = null
  if (input.saveMode === 'save') {
    const audioUrl = await uploadBase64(input.audio, input.mimeType, 'audio')
    log = await saveAnalysisLog(db, userId, {
      analysis: analysis as FoodAnalysis,
      source: 'audio',
      audioUrl,
      note: transcript,
    })
  }
  return { analysis, log }
}
