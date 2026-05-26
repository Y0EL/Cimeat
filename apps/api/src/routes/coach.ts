import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { coachChatSchema, coachHistoryQuerySchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toCoachMessageDto } from '../dto'
import { requireAuth } from '../middleware/auth'
import { logger } from '../logger'
import { runCoachChatTurn } from '../services/coach-agent-service'
import { getCoachHistory, saveCoachMessages } from '../services/coach-service'

export const coachRouter = new Hono<AppEnv>()
coachRouter.use('*', requireAuth)

coachRouter.post('/chat', zValidator('json', coachChatSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { message } = c.req.valid('json')

  const dbHistory = await getCoachHistory(db, userId, 20)
  const history = dbHistory.map((m) => ({ role: m.role, content: m.content }))

  return streamSSE(c, async (stream) => {
    let fullText = ''
    try {
      await runCoachChatTurn(userId, message, history, async (chunk) => {
        fullText += chunk
        await stream.writeSSE({ data: JSON.stringify({ chunk }) })
      })
      await stream.writeSSE({ data: JSON.stringify({ done: true }) })
    } catch (err) {
      logger.error({ err, userId }, 'coach chat stream error')
      await stream.writeSSE({ data: JSON.stringify({ error: 'Gagal memproses pesan.' }) })
      return
    }

    if (fullText) {
      await saveCoachMessages(db, userId, [
        { role: 'user', content: message },
        { role: 'model', content: fullText },
      ]).catch((err) => logger.warn({ err }, 'failed to save coach messages'))
    }
  })
})

coachRouter.get('/history', zValidator('query', coachHistoryQuerySchema), async (c) => {
  const db = getDb()
  const { limit, before } = c.req.valid('query')
  const messages = await getCoachHistory(
    db,
    c.get('userId'),
    limit,
    before ? new Date(before) : undefined,
  )
  return c.json(messages.map(toCoachMessageDto))
})
