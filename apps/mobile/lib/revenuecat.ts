import { Platform } from 'react-native'
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesError,
} from 'react-native-purchases'
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui'

export const CIMEAT_PRO_ENTITLEMENT = 'cimeat_pro'
export const CIMEAT_MAX_ENTITLEMENT = 'cimeat_max'

export type Plan = 'free' | 'pro' | 'max'

export type PaywallResult = 'NOT_PRESENTED' | 'CANCELLED' | 'PURCHASED' | 'RESTORED' | 'ERROR'

export type PurchaseOutcome =
  | { ok: true; info: CustomerInfo }
  | { ok: false; userCancelled: boolean; code: string; message: string }

let configured = false

export function configurePurchases(apiKey: string) {
  if (configured) return
  if (!apiKey) {
    console.warn('RevenueCat API key missing, skipping configure')
    return
  }
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN)
    Purchases.configure({ apiKey })
    configured = true
  } catch (err) {
    console.warn('RevenueCat configure failed (probably Expo Go):', err)
  }
}

export function isConfigured() {
  return configured
}

export async function identifyUser(firebaseUid: string) {
  if (!configured) return
  await Purchases.logIn(firebaseUid)
}

export async function signOutPurchases() {
  if (!configured) return
  await Purchases.logOut()
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null
  return Purchases.getCustomerInfo()
}

function planFromInfo(info: CustomerInfo | null): Plan {
  if (!info) return 'free'
  const active = info.entitlements.active
  if (active[CIMEAT_MAX_ENTITLEMENT]) return 'max'
  if (active[CIMEAT_PRO_ENTITLEMENT]) return 'pro'
  return 'free'
}

export async function getPlan(): Promise<Plan> {
  const info = await getCustomerInfo()
  return planFromInfo(info)
}

function mapPaywallResult(result: PAYWALL_RESULT): PaywallResult {
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
      return 'PURCHASED'
    case PAYWALL_RESULT.RESTORED:
      return 'RESTORED'
    case PAYWALL_RESULT.CANCELLED:
      return 'CANCELLED'
    case PAYWALL_RESULT.NOT_PRESENTED:
      return 'NOT_PRESENTED'
    default:
      return 'ERROR'
  }
}

export async function presentPaywall(): Promise<PaywallResult> {
  if (!configured) return 'NOT_PRESENTED'
  try {
    const result = await RevenueCatUI.presentPaywall()
    return mapPaywallResult(result)
  } catch (err) {
    console.warn('presentPaywall failed', err)
    return 'ERROR'
  }
}

export async function presentPaywallIfNeeded(entitlement = CIMEAT_PRO_ENTITLEMENT): Promise<PaywallResult> {
  if (!configured) return 'NOT_PRESENTED'
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: entitlement })
    return mapPaywallResult(result)
  } catch (err) {
    console.warn('presentPaywallIfNeeded failed', err)
    return 'ERROR'
  }
}

export async function presentCustomerCenter(): Promise<void> {
  if (!configured) return
  try {
    await RevenueCatUI.presentCustomerCenter()
  } catch (err) {
    console.warn('presentCustomerCenter failed', err)
  }
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  if (!configured) {
    return { ok: false, userCancelled: false, code: 'NOT_CONFIGURED', message: 'Belum tersedia di sini' }
  }
  try {
    const info = await Purchases.restorePurchases()
    return { ok: true, info }
  } catch (err) {
    const e = err as PurchasesError
    return {
      ok: false,
      userCancelled: false,
      code: String(e.code ?? 'UNKNOWN'),
      message: e.message ?? 'Restore gagal',
    }
  }
}

export type PlanStatus = { plan: Plan; expiresAt: Date | null }

function statusFromInfo(info: CustomerInfo | null): PlanStatus {
  const plan = planFromInfo(info)
  if (!info || plan === 'free') return { plan, expiresAt: null }
  const ent =
    plan === 'max'
      ? info.entitlements.active[CIMEAT_MAX_ENTITLEMENT]
      : info.entitlements.active[CIMEAT_PRO_ENTITLEMENT]
  return { plan, expiresAt: ent?.expirationDate ? new Date(ent.expirationDate) : null }
}

export function subscribeToPlanStatus(callback: (status: PlanStatus) => void): () => void {
  if (!configured) {
    callback({ plan: 'free', expiresAt: null })
    return () => {}
  }
  const apply = (info: CustomerInfo) => callback(statusFromInfo(info))
  Purchases.getCustomerInfo()
    .then(apply)
    .catch(() => {})
  Purchases.addCustomerInfoUpdateListener(apply)
  return () => Purchases.removeCustomerInfoUpdateListener(apply)
}

export function paywallResultToText(result: PaywallResult): string {
  if (result === 'PURCHASED') return 'Sip, langganan Cimeat lo aktif sekarang.'
  if (result === 'RESTORED') return 'Akses premium lo udah balik.'
  if (result === 'CANCELLED') return 'Oke, bisa coba lagi kapan aja.'
  if (result === 'NOT_PRESENTED') return 'Lo udah premium, gak perlu paywall.'
  return 'Ada error, coba lagi yuk.'
}
