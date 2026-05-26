import { Hono } from 'hono'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { HttpError } from '../errors'
import { requireAuth } from '../middleware/auth'
import { usageToday } from '../services/quota-service'
import { getUser } from '../services/user-service'

export const usageRouter = new Hono<AppEnv>()
usageRouter.use('*', requireAuth)

usageRouter.get('/today', async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const user = await getUser(db, userId)
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  const today = await usageToday(db, userId, user.activePlan)
  return c.json(today)
})
