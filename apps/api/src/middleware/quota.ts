import { createMiddleware } from 'hono/factory'
import type { Plan, UsageFeature } from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { HttpError } from '../errors'
import { checkAndConsume } from '../services/quota-service'
import { getUser } from '../services/user-service'

export async function resolvePlan(c: {
  get: (k: 'plan' | 'userId') => Plan | string | undefined
  set: (k: 'plan', v: Plan) => void
}): Promise<Plan> {
  const cached = c.get('plan') as Plan | undefined
  if (cached) return cached
  const userId = c.get('userId') as string
  const user = await getUser(getDb(), userId)
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  c.set('plan', user.activePlan)
  return user.activePlan
}

export function quota(feature: UsageFeature) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const plan = await resolvePlan(c)
    await checkAndConsume(getDb(), c.get('userId'), plan, feature)
    await next()
  })
}
