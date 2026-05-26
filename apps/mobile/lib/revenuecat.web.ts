export const CIMEAT_PRO_ENTITLEMENT = 'cimeat_pro'
export const CIMEAT_MAX_ENTITLEMENT = 'cimeat_max'

export type Plan = 'free' | 'pro' | 'max'

export type PaywallResult = 'NOT_PRESENTED' | 'CANCELLED' | 'PURCHASED' | 'RESTORED' | 'ERROR'

export type PurchaseOutcome =
  | { ok: true; info: null }
  | { ok: false; userCancelled: boolean; code: string; message: string }

const webUnsupported: PurchaseOutcome = {
  ok: false,
  userCancelled: false,
  code: 'WEB_UNSUPPORTED',
  message: 'Langganan Cimeat cuma ada di mobile app',
}

export function configurePurchases(_apiKey: string) {}

export function isConfigured() {
  return false
}

export async function identifyUser(_firebaseUid: string) {}

export async function signOutPurchases() {}

export async function getCustomerInfo(): Promise<null> {
  return null
}

export async function getPlan(): Promise<Plan> {
  return 'free'
}

export async function presentPaywall(): Promise<PaywallResult> {
  return 'NOT_PRESENTED'
}

export async function presentPaywallIfNeeded(_entitlement?: string): Promise<PaywallResult> {
  return 'NOT_PRESENTED'
}

export async function presentCustomerCenter(): Promise<void> {}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  return webUnsupported
}

export type PlanStatus = { plan: Plan; expiresAt: Date | null }

export function subscribeToPlanStatus(callback: (status: PlanStatus) => void): () => void {
  callback({ plan: 'free', expiresAt: null })
  return () => {}
}

export function paywallResultToText(_result: PaywallResult): string {
  return 'Buka di mobile app buat upgrade Cimeat'
}
