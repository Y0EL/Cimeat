import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { CimitMessageDto, CimitTone, CimitTtsResponse, CimitVoice } from '@cimeat/types'
import { apiFetch } from '~/lib/api'

function adviceDayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useCimitHistory() {
  return useQuery({
    queryKey: ['cimit-history'],
    queryFn: () => apiFetch<CimitMessageDto[]>('/v1/cimit/history'),
  })
}

export function useDailyAdvice() {
  const qc = useQueryClient()
  const today = adviceDayKey()
  const storageKey = `cimit_advice_${today}`
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (!active) return
        if (value) qc.setQueryData(['cimit-advice', today], JSON.parse(value))
        setChecked(true)
      })
      .catch(() => {
        if (active) setChecked(true)
      })
    return () => {
      active = false
    }
  }, [storageKey, today, qc])

  return useQuery({
    queryKey: ['cimit-advice', today],
    queryFn: async () => {
      const res = await apiFetch<{ message: string }>('/v1/cimit/daily-advice', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      await AsyncStorage.setItem(storageKey, JSON.stringify(res)).catch(() => {})
      return res
    },
    enabled: checked,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 0,
  })
}

export function useRoast() {
  return useMutation({
    mutationFn: () => apiFetch<{ message: string }>('/v1/cimit/roast', { method: 'POST' }),
  })
}

export function useCimitTts() {
  return useMutation({
    mutationFn: (input: { text: string; tone?: CimitTone; voice?: CimitVoice }) =>
      apiFetch<CimitTtsResponse>('/v1/cimit/tts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}

export function useRefreshCimitHistory() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['cimit-history'] })
}
