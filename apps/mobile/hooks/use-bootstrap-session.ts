import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { FoodDto, NutritionGoalDto, UserProfile } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

type SessionResponse = {
  profile: UserProfile
  goal: NutritionGoalDto | null
  foods: FoodDto[]
}

export function useBootstrapSession(enabled: boolean) {
  const queryClient = useQueryClient()
  const started = useRef(false)

  useEffect(() => {
    if (!enabled || started.current) return
    started.current = true
    apiFetch<SessionResponse>('/v1/auth/session', { method: 'POST' })
      .then((res) => {
        queryClient.setQueryData(['profile'], res.profile)
        queryClient.setQueryData(['foods', ''], res.foods)
        if (res.goal) queryClient.setQueryData(['goals'], res.goal)
      })
      .catch(() => {
        started.current = false
      })
  }, [enabled, queryClient])
}
