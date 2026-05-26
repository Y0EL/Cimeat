import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { nearbyRecommendSchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { HttpError } from '../errors'
import { requireAuth } from '../middleware/auth'
import { quota } from '../middleware/quota'
import { recommendNearby } from '../services/nearby-service'
import { getUser } from '../services/user-service'

export const nearbyRouter = new Hono<AppEnv>()
nearbyRouter.use('*', requireAuth)

nearbyRouter.post('/recommend', quota('nearby'), zValidator('json', nearbyRecommendSchema), async (c) => {
  const user = await getUser(getDb(), c.get('userId'))
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  const response = await recommendNearby(c.req.valid('json'), user.cimitTone)
  return c.json(response)
})
