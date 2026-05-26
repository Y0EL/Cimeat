import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { daySummaryQuerySchema, flexTrendQuerySchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { getActiveGoal } from '../services/goal-service'
import { getDailySummary } from '../services/daily-summary-service'
import { getFlexTrend } from '../services/foodlog-service'
import { getUser, profileMetrics } from '../services/user-service'

export const summaryRouter = new Hono<AppEnv>()
summaryRouter.use('*', requireAuth)

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoUtc(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

summaryRouter.get('/', zValidator('query', daySummaryQuerySchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { date } = c.req.valid('query')
  const user = await getUser(db, userId)
  const goal = await getActiveGoal(db, userId, user ? profileMetrics(user) : undefined)
  const summary = await getDailySummary(db, userId, date, goal)
  return c.json(summary)
})

summaryRouter.get('/trend', zValidator('query', flexTrendQuerySchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { period, from, to } = c.req.valid('query')
  const defaultBack = period === 'daily' ? 13 : period === 'weekly' ? 7 * 7 : 30 * 5
  const resolvedFrom = from ?? daysAgoUtc(defaultBack)
  const resolvedTo = to ?? todayUtc()
  const items = await getFlexTrend(db, userId, period, resolvedFrom, resolvedTo)
  return c.json(items)
})
