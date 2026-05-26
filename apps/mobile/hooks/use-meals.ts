import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { MealDto, MealType, UpdateMealInput } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export type MealFilters = {
  mealType?: MealType
  q?: string
  from?: string
  to?: string
}

type Page = { items: MealDto[]; nextCursor?: string }

export function useMeals(filters: MealFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['meals', filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (filters.mealType) params.set('mealType', filters.mealType)
      if (filters.q) params.set('q', filters.q)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      if (pageParam) params.set('cursor', pageParam)
      const qs = params.toString()
      return apiFetch<Page>(`/v1/meals${qs ? `?${qs}` : ''}`)
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

function invalidateAfterMutation(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['meals'] })
  qc.invalidateQueries({ queryKey: ['summary'] })
  qc.invalidateQueries({ queryKey: ['trend'] })
}

export function useUpdateMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMealInput }) =>
      apiFetch<MealDto>(`/v1/meals/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => invalidateAfterMutation(qc),
  })
}

export function useDeleteMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: true }>(`/v1/meals/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAfterMutation(qc),
  })
}

export function useBulkDeleteMeals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<{ ok: true; deleted: number }>('/v1/meals/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => invalidateAfterMutation(qc),
  })
}
