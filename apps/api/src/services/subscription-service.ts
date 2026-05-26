import { and, eq, gt, isNull, or } from 'drizzle-orm'
import { subscriptions, users, type Database } from '@cimeat/db'
import type { Plan, SubscriptionStatus } from '@cimeat/types'

type Entitlement = 'cimeat_pro' | 'cimeat_max'

const ACTIVE_STATES = new Set(['active', 'trialing', 'in_grace_period'])

function planFromEntitlements(active: Entitlement[]): Plan {
  if (active.includes('cimeat_max')) return 'max'
  if (active.includes('cimeat_pro')) return 'pro'
  return 'free'
}

export async function getSubscriptionStatus(
  db: Database,
  userId: string,
): Promise<SubscriptionStatus> {
  const now = new Date()
  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        or(isNull(subscriptions.expiresAt), gt(subscriptions.expiresAt, now)),
      ),
    )

  const active = rows
    .filter((r) => ACTIVE_STATES.has(r.status))
    .map((r) => r.entitlement as Entitlement)

  const plan = planFromEntitlements(active)

  const expiresAt = rows
    .map((r) => r.expiresAt)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0]

  return {
    plan,
    entitlements: Array.from(new Set(active)),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  }
}

type RevenueCatEvent = {
  event?: {
    type?: string
    app_user_id?: string
    entitlement_ids?: string[]
    entitlement_id?: string
    expiration_at_ms?: number
    store?: string
  }
}

export async function processRevenueCatWebhook(
  db: Database,
  payload: RevenueCatEvent,
): Promise<{ ok: boolean }> {
  const event = payload.event
  if (!event?.app_user_id) return { ok: false }

  const userId = event.app_user_id
  const userRows = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
  if (userRows.length === 0) return { ok: false }

  const entitlementIds =
    event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : [])
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null

  const type = event.type ?? ''
  const isCancel = type === 'CANCELLATION' || type === 'EXPIRATION'
  const status = isCancel ? 'expired' : 'active'

  for (const raw of entitlementIds) {
    const entitlement = raw === 'cimeat_max' ? 'cimeat_max' : 'cimeat_pro'
    await db
      .insert(subscriptions)
      .values({
        userId,
        provider: 'revenuecat',
        entitlement,
        status,
        expiresAt,
        rawPayload: payload as unknown,
      })
      .onConflictDoUpdate({
        target: [subscriptions.userId, subscriptions.entitlement],
        set: { status, expiresAt, rawPayload: payload as unknown, updatedAt: new Date() },
      })
  }

  const next = await getSubscriptionStatus(db, userId)
  await db.update(users).set({ activePlan: next.plan }).where(eq(users.id, userId))

  return { ok: true }
}
