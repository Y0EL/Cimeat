import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserProfile, UpdateProfileInput } from '@cimeat/types'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/stores/auth-store'

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiFetch<UserProfile>('/v1/profile'),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const setProfile = useAuthStore((s) => s.setProfile)

  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiFetch<UserProfile>('/v1/profile', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess(data) {
      setProfile(data)
      qc.invalidateQueries({ queryKey: queryKeys.profile })
    },
  })
}
