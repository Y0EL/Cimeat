import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod'
import { loadEnv } from './env'
import { HttpError } from './errors'
import { logger } from './logger'
import { authRouter } from './routes/auth'
import { cimitRouter } from './routes/cimit'
import { foodAiRouter } from './routes/food-ai'
import { foodLogsRouter } from './routes/food-logs'
import { foodsRouter } from './routes/foods'
import { goalsRouter } from './routes/goals'
import { healthRouter } from './routes/health'
import { nearbyRouter } from './routes/nearby'
import { profileRouter } from './routes/profile'
import { recipesRouter } from './routes/recipes'
import { subscriptionRouter } from './routes/subscription'
import { summaryRouter } from './routes/summary'
import { usageRouter } from './routes/usage'

const env = loadEnv()

const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
  }),
)

app.onError((err, c) => {
  if (err instanceof HttpError) {
    const body =
      err.details !== undefined
        ? { ok: false as const, code: err.code, details: err.details }
        : { ok: false as const, code: err.code }
    return c.json(body, err.status as ContentfulStatusCode)
  }
  if (err instanceof ZodError) {
    return c.json({ ok: false, code: 'VALIDATION_ERROR', details: err.issues }, 400)
  }
  logger.error({ err, path: c.req.path }, 'unhandled error')
  return c.json({ ok: false, code: 'INTERNAL' }, 500)
})

app.notFound((c) => c.json({ ok: false, code: 'NOT_FOUND' }, 404))

app.route('/health', healthRouter)
app.route('/v1/auth', authRouter)
app.route('/v1/profile', profileRouter)
app.route('/v1/foods', foodsRouter)
app.route('/v1/food-logs', foodLogsRouter)
app.route('/v1/goals', goalsRouter)
app.route('/v1/summary', summaryRouter)
app.route('/v1/food-ai', foodAiRouter)
app.route('/v1/recipes', recipesRouter)
app.route('/v1/nearby', nearbyRouter)
app.route('/v1/cimit', cimitRouter)
app.route('/v1/usage', usageRouter)
app.route('/v1/subscription', subscriptionRouter)

serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, (info) => {
  logger.info({ port: info.port, address: info.address }, 'Cimeat API listening')
})

process.on('SIGINT', () => {
  logger.info('Shutting down')
  process.exit(0)
})
