import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { recipeGenerateSchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { HttpError } from '../errors'
import { requireAuth } from '../middleware/auth'
import { quota } from '../middleware/quota'
import { generateRecipe, listRecipes, toRecipeResponse } from '../services/recipe-service'
import { getUser } from '../services/user-service'

export const recipesRouter = new Hono<AppEnv>()
recipesRouter.use('*', requireAuth)

recipesRouter.post('/generate', quota('recipe'), zValidator('json', recipeGenerateSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const user = await getUser(db, userId)
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  const response = await generateRecipe(db, userId, c.req.valid('json'), user.cimitTone)
  return c.json(response)
})

recipesRouter.get('/', async (c) => {
  const db = getDb()
  const rows = await listRecipes(db, c.get('userId'))
  return c.json(rows.map(toRecipeResponse))
})
