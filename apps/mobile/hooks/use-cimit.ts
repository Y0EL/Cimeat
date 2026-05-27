import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CimitMessageDto, CimitTone, CimitTtsResponse, CimitVoice } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function useCimitHistory() {
  return useQuery({
    queryKey: ['cimit-history'],
    queryFn: () => apiFetch<CimitMessageDto[]>('/v1/cimit/history'),
  })
}

export function useDailyAdvice() {
  return useQuery({
    queryKey: ['cimit-advice'],
    queryFn: () =>
      apiFetch<{ message: string }>('/v1/cimit/daily-advice', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    staleTime: 5 * 60_000,
    retry: 0,
  })
}

export function useRoast() {
  return useMutation({
    mutationFn: () => apiFetch<{ message: string }>('/v1/cimit/roast', { method: 'POST' }),
  })
}

export function useCimitTts() {
  return useMutation({
    mutationFn: (input: { text: string; tone?: CimitTone; voice?: CimitVoice }) =>
      apiFetch<CimitTtsResponse>('/v1/cimit/tts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}

export function useRefreshCimitHistory() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['cimit-history'] })
}
