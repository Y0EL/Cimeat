import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod'
import { loadEnv } from './env'
import { HttpError } from './errors'
import { logger } from './logger'
import { authRouter } from './routes/auth'
import { coachRouter } from './routes/coach'
import { foodScanRouter } from './routes/food-scan'
import { foodsRouter } from './routes/foods'
import { goalsRouter } from './routes/goals'
import { healthRouter } from './routes/health'
import { linkingRouter } from './routes/linking'
import { mealsRouter } from './routes/meals'
import { notifRouter } from './routes/notif'
import { profileRouter } from './routes/profile'
import { recipeRouter } from './routes/recipe'
import { summaryRouter } from './routes/summary'
import { whatsappRouter } from './routes/whatsapp'
import { registerCrons } from './services/cron-service'
import { createTelegramBot } from './telegram/bot'
import { getDb } from './db'
import { restoreActiveSessions } from './whatsapp/manager'

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
app.route('/v1/meals', mealsRouter)
app.route('/v1/goals', goalsRouter)
app.route('/v1/summary', summaryRouter)
app.route('/v1/food-scan', foodScanRouter)
app.route('/v1/coach', coachRouter)
app.route('/v1/recipe', recipeRouter)
app.route('/v1/linking', linkingRouter)
app.route('/v1/notif', notifRouter)
app.route('/v1/whatsapp', whatsappRouter)

const bot = createTelegramBot(env.TELEGRAM_BOT_TOKEN)

bot
  .start({
    drop_pending_updates: true,
    onStart: (info) => logger.info({ username: info.username }, 'Telegram bot polling started'),
  })
  .catch((err) => {
    const description =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err && 'description' in err
          ? String((err as { description: unknown }).description)
          : String(err)
    logger.error({ description }, 'Telegram polling stopped, instance lain mungkin lagi polling')
  })

registerCrons(getDb())

void restoreActiveSessions(getDb()).catch((err) =>
  logger.error({ err }, 'restore wa sessions gagal'),
)

serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, (info) => {
  logger.info({ port: info.port, address: info.address }, 'Cimeat API listening')
})

process.on('SIGINT', async () => {
  logger.info('Shutting down')
  await bot.stop()
  process.exit(0)
})
