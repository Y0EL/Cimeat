import { useQuery } from '@tanstack/react-query'
import type { CoachMessageDto } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

// Chat-only AI Diet Coach. No voice, no audio, no quota.
export function useCoachHistory() {
  return useQuery({
    queryKey: ['coach-history'],
    queryFn: () => apiFetch<CoachMessageDto[]>('/v1/coach/history'),
  })
}
