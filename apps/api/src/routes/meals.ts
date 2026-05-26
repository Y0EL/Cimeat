import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  bulkDeleteMealsSchema,
  createMealSchema,
  listMealsQuerySchema,
  updateMealSchema,
} from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toMealDto } from '../dto'
import { requireAuth } from '../middleware/auth'
import {
  bulkDeleteMeals,
  createMeal,
  deleteMeal,
  listMeals,
  updateMeal,
} from '../services/meal-service'

export const mealsRouter = new Hono<AppEnv>()
mealsRouter.use('*', requireAuth)

mealsRouter.get('/', zValidator('query', listMealsQuerySchema), async (c) => {
  const db = getDb()
  const result = await listMeals(db, c.get('userId'), c.req.valid('query'))
  const body: { items: ReturnType<typeof toMealDto>[]; nextCursor?: string } = {
    items: result.rows.map(toMealDto),
  }
  if (result.nextCursor) body.nextCursor = result.nextCursor
  return c.json(body)
})

mealsRouter.post('/', zValidator('json', createMealSchema), async (c) => {
  const db = getDb()
  const meal = await createMeal(db, c.get('userId'), c.req.valid('json'))
  return c.json(toMealDto(meal), 201)
})

mealsRouter.post('/bulk-delete', zValidator('json', bulkDeleteMealsSchema), async (c) => {
  const db = getDb()
  const { ids } = c.req.valid('json')
  const deleted = await bulkDeleteMeals(db, c.get('userId'), ids)
  return c.json({ ok: true, deleted })
})

mealsRouter.patch('/:id', zValidator('json', updateMealSchema), async (c) => {
  const db = getDb()
  const meal = await updateMeal(db, c.get('userId'), c.req.param('id'), c.req.valid('json'))
  return c.json(toMealDto(meal))
})

mealsRouter.delete('/:id', async (c) => {
  const db = getDb()
  await deleteMeal(db, c.get('userId'), c.req.param('id'))
  return c.json({ ok: true })
})
