import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  AnalyzeAudioResponse,
  AnalyzeImageResponse,
  FoodAnalysis,
  MealType,
} from '@cimeat/types'
import { apiFetch } from '~/lib/api'

type SaveMode = 'draft' | 'save'

export function useAnalyzeImage() {
  return useMutation({
    mutationFn: (input: {
      image: string
      mimeType: string
      mealType?: MealType
      saveMode?: SaveMode
    }) =>
      apiFetch<AnalyzeImageResponse>('/v1/food-ai/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ saveMode: 'draft', ...input }),
      }),
  })
}

export function useAnalyzeAudio() {
  return useMutation({
    mutationFn: (input: { audio: string; mimeType: string; saveMode?: SaveMode }) =>
      apiFetch<AnalyzeAudioResponse>('/v1/food-ai/analyze-audio', {
        method: 'POST',
        body: JSON.stringify({ saveMode: 'draft', ...input }),
      }),
  })
}

export function useAnalyzeText() {
  return useMutation({
    mutationFn: (input: { text: string; mealType?: MealType; saveMode?: SaveMode }) =>
      apiFetch<FoodAnalysis>('/v1/food-ai/analyze-text', {
        method: 'POST',
        body: JSON.stringify({ saveMode: 'draft', ...input }),
      }),
  })
}

export function useInvalidateFoodData() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['food-logs'] })
    qc.invalidateQueries({ queryKey: ['summary'] })
    qc.invalidateQueries({ queryKey: ['trend'] })
    qc.invalidateQueries({ queryKey: ['usage', 'today'] })
  }
}
