import { useQuery } from '@tanstack/react-query'
import type { DailySummary, FlexTrendItem } from '@cimeat/types'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export function useDailySummary(date: string) {
  return useQuery({
    queryKey: queryKeys.summary.daily(date),
    queryFn: () => apiFetch<DailySummary>(`/v1/summary?date=${date}`),
  })
}

export function useTrend(period: string, from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.summary.trend(period, from, to),
    queryFn: () =>
      apiFetch<FlexTrendItem[]>(`/v1/summary/trend?period=${period}&from=${from}&to=${to}`),
  })
}
