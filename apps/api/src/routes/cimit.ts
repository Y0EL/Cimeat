import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import {
  cimitAdviceSchema,
  cimitChatSchema,
  cimitHistoryQuerySchema,
  cimitTtsSchema,
} from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toCimitMessageDto } from '../dto'
import { HttpError } from '../errors'
import { logger } from '../logger'
import { requireAuth } from '../middleware/auth'
import { quota } from '../middleware/quota'
import {
  chatStream,
  dailyAdvice,
  getCimitHistory,
  roast,
  saveCimitMessages,
} from '../services/cimit-service'
import { synthesize } from '../services/tts-service'
import { getUser } from '../services/user-service'

export const cimitRouter = new Hono<AppEnv>()
cimitRouter.use('*', requireAuth)

cimitRouter.post('/daily-advice', quota('cimit_advice'), zValidator('json', cimitAdviceSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const user = await getUser(db, userId)
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  const { date } = c.req.valid('json')
  const message = await dailyAdvice(db, userId, user.cimitTone, date)
  return c.json({ message })
})

cimitRouter.post('/roast', async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const user = await getUser(db, userId)
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  const message = await roast(db, userId, user.cimitTone)
  return c.json({ message })
})

cimitRouter.post('/chat', zValidator('json', cimitChatSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { message } = c.req.valid('json')
  const user = await getUser(db, userId)
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  const tone = user.cimitTone

  const dbHistory = await getCimitHistory(db, userId, 20)
  const history = dbHistory.map((m) => ({ role: m.role, content: m.content }))

  return streamSSE(c, async (stream) => {
    let fullText = ''
    try {
      await chatStream(userId, message, history, tone, async (chunk) => {
        fullText += chunk
        await stream.writeSSE({ data: JSON.stringify({ chunk }) })
      })
      await stream.writeSSE({ data: JSON.stringify({ done: true }) })
    } catch (err) {
      logger.error({ err, userId }, 'cimit chat stream error')
      await stream.writeSSE({ data: JSON.stringify({ error: 'Gagal memproses pesan.' }) })
      return
    }

    if (fullText) {
      await saveCimitMessages(db, userId, 'chat', [
        { role: 'user', content: message },
        { role: 'model', content: fullText, tone },
      ]).catch((err) => logger.warn({ err }, 'failed to save cimit messages'))
    }
  })
})

cimitRouter.get('/history', zValidator('query', cimitHistoryQuerySchema), async (c) => {
  const db = getDb()
  const { limit, before } = c.req.valid('query')
  const messages = await getCimitHistory(
    db,
    c.get('userId'),
    limit,
    before ? new Date(before) : undefined,
  )
  return c.json(messages.map(toCimitMessageDto))
})

cimitRouter.post('/tts', quota('tts'), zValidator('json', cimitTtsSchema), async (c) => {
  const { text, tone, voice } = c.req.valid('json')
  const result = await synthesize(text, tone, voice)
  return c.json(result)
})
