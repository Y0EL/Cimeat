import { createHash } from 'crypto'
import type { CimitTone, CimitVoice } from '@cimeat/types'
import { loadEnv } from '../env'
import { HttpError } from '../errors'
import { logger } from '../logger'
import { getOrUploadAudio, uploadBase64 } from './storage-service'

export type TtsResult = { audioUrl: string; text: string }

async function synthElevenLabs(text: string, apiKey: string, voiceId: string): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
  })
  if (!res.ok) throw new Error(`elevenlabs ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function synthOpenAI(text: string, apiKey: string, voiceId: string): Promise<Buffer> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: voiceId || 'alloy', input: text }),
  })
  if (!res.ok) throw new Error(`openai tts ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function buildCacheKey(text: string, voiceName: string, provider: string): string {
  const hash = createHash('sha256').update(`${provider}:${voiceName}:${text}`).digest('hex').slice(0, 24)
  return `audio/${hash}.wav`
}

export async function synthesize(
  text: string,
  tone: CimitTone = 'normal',
  voice: CimitVoice = 'female',
  signal?: AbortSignal,
): Promise<TtsResult> {
  const env = loadEnv()
  if (env.TTS_PROVIDER === 'none') return { audioUrl: '', text }

  const voiceName = env.TTS_VOICE_ID || (voice === 'male' ? env.TTS_VOICE_MALE : env.TTS_VOICE_FEMALE)

  try {
    let buffer: Buffer
    const mime = env.TTS_PROVIDER === 'openai' ? 'audio/mpeg' : 'audio/wav'

    if (env.TTS_PROVIDER === 'elevenlabs') {
      if (!env.TTS_API_KEY) throw new HttpError(501, 'NOT_IMPLEMENTED', 'TTS belum dikonfigurasi')
      buffer = await synthElevenLabs(text, env.TTS_API_KEY, voiceName)
    } else if (env.TTS_PROVIDER === 'openai') {
      if (!env.TTS_API_KEY) throw new HttpError(501, 'NOT_IMPLEMENTED', 'TTS belum dikonfigurasi')
      buffer = await synthOpenAI(text, env.TTS_API_KEY, voiceName)
    } else {
      throw new HttpError(501, 'NOT_IMPLEMENTED', 'TTS provider tidak didukung')
    }

    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    const cacheKey = buildCacheKey(text, voiceName, env.TTS_PROVIDER)
    const audioUrl = await getOrUploadAudio(buffer, mime, cacheKey)
    return { audioUrl: audioUrl ?? '', text }
  } catch (err) {
    if (err instanceof HttpError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    logger.error({ err, provider: env.TTS_PROVIDER }, 'tts synthesis failed')
    throw new HttpError(502, 'AI_ERROR', 'Gagal sintesis suara')
  }
}
