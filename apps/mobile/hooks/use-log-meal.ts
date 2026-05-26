import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateMealInput, MealDto } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function useLogMeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMealInput) =>
      apiFetch<MealDto>('/v1/meals', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['trend'] })
    },
  })
}
