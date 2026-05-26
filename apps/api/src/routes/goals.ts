import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { upsertNutritionGoalSchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toNutritionGoalDto } from '../dto'
import { requireAuth } from '../middleware/auth'
import { getActiveGoal, upsertGoal } from '../services/goal-service'
import { getUser, profileMetrics } from '../services/user-service'

export const goalsRouter = new Hono<AppEnv>()
goalsRouter.use('*', requireAuth)

goalsRouter.get('/', async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const user = await getUser(db, userId)
  const goal = await getActiveGoal(db, userId, user ? profileMetrics(user) : undefined)
  return c.json(goal)
})

goalsRouter.put('/', zValidator('json', upsertNutritionGoalSchema), async (c) => {
  const db = getDb()
  const row = await upsertGoal(db, c.get('userId'), c.req.valid('json'))
  return c.json(toNutritionGoalDto(row))
})
