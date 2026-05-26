import { useCallback, useEffect, useState } from 'react'
import {
  paywallResultToText,
  presentCustomerCenter,
  presentPaywall,
  restorePurchases as restore,
  subscribeToPlanStatus,
  type PaywallResult,
  type Plan,
  type PlanStatus,
} from '~/lib/revenuecat'
import { track } from '~/lib/analytics'

export type SubscriptionState = PlanStatus & {
  loading: boolean
  isPro: boolean
  isMax: boolean
}

export function useSubscription() {
  const [state, setState] = useState<{ plan: Plan; expiresAt: Date | null; loading: boolean }>({
    plan: 'free',
    expiresAt: null,
    loading: true,
  })

  useEffect(() => {
    let mounted = true
    const unsub = subscribeToPlanStatus((status) => {
      if (!mounted) return
      setState({ ...status, loading: false })
    })
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  const openPaywall = useCallback(async () => {
    track('paywall_open')
    const result: PaywallResult = await presentPaywall()
    return { result, message: paywallResultToText(result) }
  }, [])

  const openCustomerCenter = useCallback(async () => {
    await presentCustomerCenter()
  }, [])

  const restorePurchases = useCallback(async () => {
    return restore()
  }, [])

  return {
    plan: state.plan,
    expiresAt: state.expiresAt,
    loading: state.loading,
    isPro: state.plan === 'pro' || state.plan === 'max',
    isMax: state.plan === 'max',
    openPaywall,
    openCustomerCenter,
    restorePurchases,
  }
}
