import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { FoodLogDto, CreateFoodLogInput } from '@cimeat/types'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export function useFoodLogs(date: string) {
  const from = `${date}T00:00:00.000Z`
  const to = `${date}T23:59:59.999Z`

  return useQuery({
    queryKey: queryKeys.foodLogs.byDate(date),
    queryFn: async () => {
      const res = await apiFetch<{ items: FoodLogDto[]; nextCursor?: string }>(
        `/v1/food-logs?from=${from}&to=${to}&limit=200`,
      )
      return res.items ?? []
    },
  })
}

export function useCreateFoodLog(date: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateFoodLogInput) =>
      apiFetch<FoodLogDto>('/v1/food-logs', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess() {
      qc.invalidateQueries({ queryKey: queryKeys.foodLogs.byDate(date) })
      qc.invalidateQueries({ queryKey: queryKeys.summary.daily(date) })
    },
  })
}

export function useDeleteFoodLog(date: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/v1/food-logs/${id}`, { method: 'DELETE' }),
    onSuccess() {
      qc.invalidateQueries({ queryKey: queryKeys.foodLogs.byDate(date) })
      qc.invalidateQueries({ queryKey: queryKeys.summary.daily(date) })
    },
  })
}
