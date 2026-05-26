import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { foodScanRequestSchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { requireAuth } from '../middleware/auth'
import { scanFood } from '../services/food-vision-service'

export const foodScanRouter = new Hono<AppEnv>()
foodScanRouter.use('*', requireAuth)

foodScanRouter.post('/', zValidator('json', foodScanRequestSchema), async (c) => {
  const { image, mimeType } = c.req.valid('json')
  const result = await scanFood(image, mimeType)
  return c.json(result)
})
