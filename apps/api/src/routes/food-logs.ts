import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  bulkDeleteFoodLogsSchema,
  createFoodLogSchema,
  listFoodLogsQuerySchema,
  updateFoodLogSchema,
} from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toFoodLogDto } from '../dto'
import { requireAuth } from '../middleware/auth'
import {
  bulkDeleteFoodLogs,
  createFoodLog,
  deleteFoodLog,
  listFoodLogs,
  updateFoodLog,
} from '../services/foodlog-service'

export const foodLogsRouter = new Hono<AppEnv>()
foodLogsRouter.use('*', requireAuth)

foodLogsRouter.get('/', zValidator('query', listFoodLogsQuerySchema), async (c) => {
  const db = getDb()
  const result = await listFoodLogs(db, c.get('userId'), c.req.valid('query'))
  const body: { items: ReturnType<typeof toFoodLogDto>[]; nextCursor?: string } = {
    items: result.rows.map(toFoodLogDto),
  }
  if (result.nextCursor) body.nextCursor = result.nextCursor
  return c.json(body)
})

foodLogsRouter.post('/', zValidator('json', createFoodLogSchema), async (c) => {
  const db = getDb()
  const log = await createFoodLog(db, c.get('userId'), c.req.valid('json'))
  return c.json(toFoodLogDto(log), 201)
})

foodLogsRouter.post('/bulk-delete', zValidator('json', bulkDeleteFoodLogsSchema), async (c) => {
  const db = getDb()
  const { ids } = c.req.valid('json')
  const deleted = await bulkDeleteFoodLogs(db, c.get('userId'), ids)
  return c.json({ ok: true, deleted })
})

foodLogsRouter.patch('/:id', zValidator('json', updateFoodLogSchema), async (c) => {
  const db = getDb()
  const log = await updateFoodLog(db, c.get('userId'), c.req.param('id'), c.req.valid('json'))
  return c.json(toFoodLogDto(log))
})

foodLogsRouter.delete('/:id', async (c) => {
  const db = getDb()
  await deleteFoodLog(db, c.get('userId'), c.req.param('id'))
  return c.json({ ok: true })
})
