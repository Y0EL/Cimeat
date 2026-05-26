import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateFoodInput, FoodDto, UpdateFoodInput } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function useFoods(q = '') {
  return useQuery({
    queryKey: ['foods', q],
    queryFn: () => apiFetch<FoodDto[]>(`/v1/foods${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  })
}

export function useCreateFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFoodInput) =>
      apiFetch<FoodDto>('/v1/foods', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  })
}

export function useUpdateFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFoodInput }) =>
      apiFetch<FoodDto>(`/v1/foods/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  })
}

export function useDeleteFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: true }>(`/v1/foods/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  })
}
