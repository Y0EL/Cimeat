import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreateFoodLogInput,
  FoodLogDto,
  MealType,
  UpdateFoodLogInput,
} from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export type FoodLogFilters = {
  mealType?: MealType
  q?: string
  from?: string
  to?: string
}

type Page = { items: FoodLogDto[]; nextCursor?: string }

export function useFoodLogs(filters: FoodLogFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['food-logs', filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (filters.mealType) params.set('mealType', filters.mealType)
      if (filters.q) params.set('q', filters.q)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      if (pageParam) params.set('cursor', pageParam)
      const qs = params.toString()
      return apiFetch<Page>(`/v1/food-logs${qs ? `?${qs}` : ''}`)
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

function invalidateAfterMutation(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['food-logs'] })
  qc.invalidateQueries({ queryKey: ['summary'] })
  qc.invalidateQueries({ queryKey: ['trend'] })
}

export function useCreateFoodLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFoodLogInput) =>
      apiFetch<FoodLogDto>('/v1/food-logs', { method: 'POST', body: JSON.stringify(input) }),
    onSettled: () => invalidateAfterMutation(qc),
  })
}

export function useUpdateFoodLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFoodLogInput }) =>
      apiFetch<FoodLogDto>(`/v1/food-logs/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => invalidateAfterMutation(qc),
  })
}

export function useDeleteFoodLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/v1/food-logs/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAfterMutation(qc),
  })
}

export function useBulkDeleteFoodLogs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<{ ok: true; deleted: number }>('/v1/food-logs/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => invalidateAfterMutation(qc),
  })
}
