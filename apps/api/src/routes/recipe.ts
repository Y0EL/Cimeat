import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { recipeChatSchema } from '@cimeat/types'
import type { AppEnv } from '../context'
import { requireAuth } from '../middleware/auth'
import { logger } from '../logger'
import { runRecipeTurn, type RecipeResult } from '../services/recipe-service'

export const recipeRouter = new Hono<AppEnv>()
recipeRouter.use('*', requireAuth)

recipeRouter.post('/chat', zValidator('json', recipeChatSchema), async (c) => {
  const { message } = c.req.valid('json')

  return streamSSE(c, async (stream) => {
    let result: RecipeResult | null = null
    try {
      await runRecipeTurn(
        message,
        [],
        async (chunk) => {
          await stream.writeSSE({ data: JSON.stringify({ chunk }) })
        },
        async (r) => {
          result = r
          await stream.writeSSE({ data: JSON.stringify({ recipeResult: r }) })
        },
      )
      await stream.writeSSE({ data: JSON.stringify({ done: true, recipeResult: result }) })
    } catch (err) {
      logger.error({ err }, 'recipe chat stream error')
      await stream.writeSSE({ data: JSON.stringify({ error: 'Gagal memproses.' }) })
    }
  })
})
