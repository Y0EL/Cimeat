import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { updateProfileSchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toUserProfileDto } from '../dto'
import { HttpError } from '../errors'
import { requireAuth } from '../middleware/auth'
import { applySuggestedGoal } from '../services/goal-service'
import { computeGoalFromProfile } from '../services/nutrition-util'
import { getUser, profileMetrics, updateUserProfile } from '../services/user-service'

export const profileRouter = new Hono<AppEnv>()
profileRouter.use('*', requireAuth)

profileRouter.get('/', async (c) => {
  const db = getDb()
  const user = await getUser(db, c.get('userId'))
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  return c.json(toUserProfileDto(user))
})

profileRouter.patch('/', zValidator('json', updateProfileSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const input = c.req.valid('json')

  const updated = await updateUserProfile(db, userId, input)

  // When body metrics are touched and the profile now has the full set needed
  // for TDEE, recompute and upsert a suggested goal so targets stay in sync.
  const metricsTouched =
    input.sex !== undefined ||
    input.birthYear !== undefined ||
    input.heightCm !== undefined ||
    input.weightKg !== undefined ||
    input.activityLevel !== undefined ||
    input.goalType !== undefined

  if (metricsTouched) {
    const hasMetrics =
      updated.sex && updated.birthYear && updated.heightCm && updated.weightKg
    if (hasMetrics) {
      const suggested = computeGoalFromProfile(profileMetrics(updated))
      await applySuggestedGoal(db, userId, suggested)
    }
  }

  return c.json(toUserProfileDto(updated))
})
