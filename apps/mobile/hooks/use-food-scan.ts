import { useMutation } from '@tanstack/react-query'
import type { FoodScanResponse } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function useFoodScan() {
  return useMutation({
    mutationFn: (input: { image: string; mimeType: string }) =>
      apiFetch<FoodScanResponse>('/v1/food-scan', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}
