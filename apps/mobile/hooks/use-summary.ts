import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DailySummary, UpdateProfileInput, UserProfile } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useDailySummary(date: string = todayDate()) {
  return useQuery({
    queryKey: ['summary', date],
    queryFn: () => apiFetch<DailySummary>(`/v1/summary?date=${date}`),
  })
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<UserProfile>('/v1/profile'),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiFetch<UserProfile>('/v1/profile', { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (profile) => {
      qc.setQueryData(['profile'], profile)
      // Updating body metrics can recompute the goal server-side.
      qc.invalidateQueries({ queryKey: ['goals'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
    },
  })
}
