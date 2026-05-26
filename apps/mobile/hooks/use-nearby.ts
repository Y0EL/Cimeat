import { useMutation } from '@tanstack/react-query'
import type { EatingMode, NearbyResponse } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function useNearbyRecommend() {
  return useMutation({
    mutationFn: (input: { lat: number; lng: number; mode: EatingMode; radius_m?: number }) =>
      apiFetch<NearbyResponse>('/v1/nearby/recommend', {
        method: 'POST',
        body: JSON.stringify({ radius_m: 1000, ...input }),
      }),
  })
}
