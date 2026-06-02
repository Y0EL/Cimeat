import { useMutation } from '@tanstack/react-query'
import type { AnalyzeImageResponse, AnalyzeAudioResponse, FoodAnalysis } from '@cimeat/types'
import { apiFetch } from '@/lib/api'

export function useAnalyzeImage() {
  return useMutation({
    mutationFn: (input: { image: string; mimeType?: string }) =>
      apiFetch<AnalyzeImageResponse>('/v1/food-ai/analyze-image', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}

export function useAnalyzeAudio() {
  return useMutation({
    mutationFn: (input: { audio: string; mimeType?: string }) =>
      apiFetch<AnalyzeAudioResponse>('/v1/food-ai/analyze-audio', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}

export function useAnalyzeText() {
  return useMutation({
    mutationFn: (input: { text: string }) =>
      apiFetch<FoodAnalysis>('/v1/food-ai/analyze-text', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}
