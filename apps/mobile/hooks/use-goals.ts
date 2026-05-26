import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NutritionGoalDto, UpsertNutritionGoalInput } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => apiFetch<NutritionGoalDto>('/v1/goals'),
  })
}

export function useUpsertGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertNutritionGoalInput) =>
      apiFetch<NutritionGoalDto>('/v1/goals', { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: (goal) => {
      qc.setQueryData(['goals'], goal)
      qc.invalidateQueries({ queryKey: ['summary'] })
    },
  })
}
