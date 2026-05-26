import { Hono } from 'hono'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toFoodDto, toNutritionGoalDto, toUserProfileDto } from '../dto'
import { HttpError } from '../errors'
import { requireAuth } from '../middleware/auth'
import { listFoods } from '../services/food-service'
import { getActiveGoalRow } from '../services/goal-service'
import { ensureUserDefaults } from '../services/seed-service'
import { getUser, profileMetrics } from '../services/user-service'

export const authRouter = new Hono<AppEnv>()
authRouter.use('*', requireAuth)

authRouter.post('/session', async (c) => {
  const db = getDb()
  const userId = c.get('userId')

  const user = await getUser(db, userId)
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')

  await ensureUserDefaults(db, userId, profileMetrics(user))

  const goalRow = await getActiveGoalRow(db, userId)
  const foodRows = await listFoods(db, userId)

  return c.json({
    profile: toUserProfileDto(user),
    goal: goalRow ? toNutritionGoalDto(goalRow) : null,
    foods: foodRows.map(toFoodDto),
  })
})
