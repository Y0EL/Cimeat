import { useQuery } from '@tanstack/react-query'
import type { FlexTrendItem } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

export type TrendPeriod = 'daily' | 'weekly' | 'monthly'

export function useFlexTrend(period: TrendPeriod, from: string, to: string) {
  return useQuery({
    queryKey: ['trend', period, from, to],
    enabled: !!from && !!to,
    queryFn: () =>
      apiFetch<FlexTrendItem[]>(`/v1/summary/trend?period=${period}&from=${from}&to=${to}`),
  })
}
