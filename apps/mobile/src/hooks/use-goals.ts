import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NutritionGoalDto, UpsertNutritionGoalInput } from '@cimeat/types'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/stores/auth-store'

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => apiFetch<NutritionGoalDto>('/v1/goals'),
  })
}

export function useUpsertGoal() {
  const qc = useQueryClient()
  const setGoal = useAuthStore((s) => s.setGoal)

  return useMutation({
    mutationFn: (input: UpsertNutritionGoalInput) =>
      apiFetch<NutritionGoalDto>('/v1/goals', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess(data) {
      setGoal(data)
      qc.invalidateQueries({ queryKey: queryKeys.goals })
    },
  })
}
