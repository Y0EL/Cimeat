import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { createFoodSchema, updateFoodSchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toFoodDto } from '../dto'
import { requireAuth } from '../middleware/auth'
import { createFood, deleteFood, listFoods, updateFood } from '../services/food-service'

export const foodsRouter = new Hono<AppEnv>()
foodsRouter.use('*', requireAuth)

const listQuerySchema = z.object({ q: z.string().max(120).optional() })

foodsRouter.get('/', zValidator('query', listQuerySchema), async (c) => {
  const db = getDb()
  const { q } = c.req.valid('query')
  const rows = await listFoods(db, c.get('userId'), q)
  return c.json(rows.map(toFoodDto))
})

foodsRouter.post('/', zValidator('json', createFoodSchema), async (c) => {
  const db = getDb()
  const food = await createFood(db, c.get('userId'), c.req.valid('json'))
  return c.json(toFoodDto(food), 201)
})

foodsRouter.patch('/:id', zValidator('json', updateFoodSchema), async (c) => {
  const db = getDb()
  const food = await updateFood(db, c.get('userId'), c.req.param('id'), c.req.valid('json'))
  return c.json(toFoodDto(food))
})

foodsRouter.delete('/:id', async (c) => {
  const db = getDb()
  await deleteFood(db, c.get('userId'), c.req.param('id'))
  return c.json({ ok: true })
})
