import { useMutation, useQuery } from '@tanstack/react-query'
import type { RecipeGenerateInput, RecipeResponse } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function useGenerateRecipe() {
  return useMutation({
    mutationFn: (input: RecipeGenerateInput) =>
      apiFetch<RecipeResponse>('/v1/recipes/generate', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}

export function useSavedRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: () => apiFetch<RecipeResponse[]>('/v1/recipes'),
  })
}
