import { Hono } from 'hono'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { loadEnv } from '../env'
import { HttpError } from '../errors'
import { logger } from '../logger'
import { requireAuth } from '../middleware/auth'
import {
  getSubscriptionStatus,
  processRevenueCatWebhook,
} from '../services/subscription-service'

export const subscriptionRouter = new Hono<AppEnv>()

// Webhook is unauthenticated (verified by shared secret header) — register
// BEFORE the auth middleware so it is not blocked.
subscriptionRouter.post('/webhook/revenuecat', async (c) => {
  const env = loadEnv()
  if (env.REVENUECAT_WEBHOOK_AUTH) {
    const auth = c.req.header('Authorization')
    if (auth !== env.REVENUECAT_WEBHOOK_AUTH) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Webhook auth gagal')
    }
  }
  const payload = await c.req.json().catch(() => null)
  if (!payload) throw new HttpError(400, 'VALIDATION_ERROR', 'Body tidak valid')
  const result = await processRevenueCatWebhook(getDb(), payload)
  logger.info({ result }, 'revenuecat webhook processed')
  return c.json({ ok: result.ok })
})

subscriptionRouter.use('/status', requireAuth)
subscriptionRouter.get('/status', async (c) => {
  const status = await getSubscriptionStatus(getDb(), c.get('userId'))
  return c.json(status)
})
