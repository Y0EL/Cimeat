import { useQuery } from '@tanstack/react-query'
import type { UsageFeature, UsageToday } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export function useUsageToday() {
  return useQuery({
    queryKey: ['usage', 'today'],
    queryFn: () => apiFetch<UsageToday>('/v1/usage/today'),
    staleTime: 60_000,
  })
}

export type QuotaInfo = {
  used: number
  limit: number
  remaining: number
  unlimited: boolean
  exhausted: boolean
}

export function useFeatureQuota(feature: UsageFeature): QuotaInfo | null {
  const usage = useUsageToday()
  const entry = usage.data?.features.find((f) => f.feature === feature)
  if (!entry) return null
  const unlimited = entry.limit < 0
  return {
    used: entry.used,
    limit: entry.limit,
    remaining: entry.remaining,
    unlimited,
    exhausted: !unlimited && entry.remaining <= 0,
  }
}
