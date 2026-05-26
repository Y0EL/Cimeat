import { and, eq, sql } from 'drizzle-orm'
import { usageEvents, type Database } from '@cimeat/db'
import {
  QUOTA_LIMITS,
  usageFeatureSchema,
  type Plan,
  type UsageFeature,
  type UsageToday,
} from '@cimeat/types'
import { HttpError } from '../errors'

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function limitFor(plan: Plan, feature: UsageFeature): number {
  return QUOTA_LIMITS[plan][feature]
}

async function currentCount(
  db: Database,
  userId: string,
  feature: UsageFeature,
  date: string,
): Promise<number> {
  const rows = await db
    .select({ count: usageEvents.count })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.feature, feature),
        eq(usageEvents.usageDate, date),
      ),
    )
    .limit(1)
  return rows[0]?.count ?? 0
}

export async function checkAndConsume(
  db: Database,
  userId: string,
  plan: Plan,
  feature: UsageFeature,
): Promise<void> {
  const limit = limitFor(plan, feature)
  const date = todayUtc()

  if (limit !== -1) {
    const used = await currentCount(db, userId, feature, date)
    if (used >= limit) {
      throw new HttpError(402, 'QUOTA_EXCEEDED', 'Kuota harian habis', { feature })
    }
  }

  await db
    .insert(usageEvents)
    .values({ userId, feature, planSnapshot: plan, usageDate: date, count: 1 })
    .onConflictDoUpdate({
      target: [usageEvents.userId, usageEvents.feature, usageEvents.usageDate],
      set: { count: sql`${usageEvents.count} + 1`, updatedAt: new Date() },
    })
}

export async function usageToday(
  db: Database,
  userId: string,
  plan: Plan,
): Promise<UsageToday> {
  const date = todayUtc()
  const rows = await db
    .select({ feature: usageEvents.feature, count: usageEvents.count })
    .from(usageEvents)
    .where(and(eq(usageEvents.userId, userId), eq(usageEvents.usageDate, date)))

  const usedByFeature = new Map<UsageFeature, number>()
  for (const r of rows) usedByFeature.set(r.feature, r.count)

  const features = usageFeatureSchema.options.map((feature) => {
    const used = usedByFeature.get(feature) ?? 0
    const limit = limitFor(plan, feature)
    const remaining = limit === -1 ? -1 : Math.max(0, limit - used)
    return { feature, used, limit, remaining }
  })

  return { plan, date, features }
}
