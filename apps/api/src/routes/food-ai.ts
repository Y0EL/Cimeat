import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  analyzeAudioRequestSchema,
  analyzeImageRequestSchema,
  analyzeTextRequestSchema,
} from '@cimeat/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { toFoodLogDto } from '../dto'
import { HttpError } from '../errors'
import { requireAuth } from '../middleware/auth'
import { quota } from '../middleware/quota'
import { analyzeAudio } from '../services/audio-service'
import { analyzeText } from '../services/text-service'
import { getUser } from '../services/user-service'
import { analyzeImage } from '../services/vision-service'

export const foodAiRouter = new Hono<AppEnv>()
foodAiRouter.use('*', requireAuth)

async function toneOf(userId: string) {
  const user = await getUser(getDb(), userId)
  if (!user) throw new HttpError(404, 'NOT_FOUND', 'User gak ketemu')
  return user.cimitTone
}

foodAiRouter.post(
  '/analyze-image',
  quota('vision'),
  zValidator('json', analyzeImageRequestSchema),
  async (c) => {
    const db = getDb()
    const userId = c.get('userId')
    const tone = await toneOf(userId)
    const { analysis, log } = await analyzeImage(db, userId, c.req.valid('json'), tone)
    return c.json({ ...analysis, log: log ? toFoodLogDto(log) : null })
  },
)

foodAiRouter.post(
  '/analyze-audio',
  quota('audio'),
  zValidator('json', analyzeAudioRequestSchema),
  async (c) => {
    const db = getDb()
    const userId = c.get('userId')
    const tone = await toneOf(userId)
    const { analysis, log } = await analyzeAudio(db, userId, c.req.valid('json'), tone)
    return c.json({ ...analysis, log: log ? toFoodLogDto(log) : null })
  },
)

foodAiRouter.post(
  '/analyze-text',
  quota('text'),
  zValidator('json', analyzeTextRequestSchema),
  async (c) => {
    const db = getDb()
    const userId = c.get('userId')
    const tone = await toneOf(userId)
    const { analysis, log } = await analyzeText(db, userId, c.req.valid('json'), tone)
    return c.json({ ...analysis, log: log ? toFoodLogDto(log) : null })
  },
)
