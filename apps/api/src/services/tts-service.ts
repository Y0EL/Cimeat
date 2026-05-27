import { createHash } from 'crypto'
import { GoogleGenAI } from '@google/genai'
import type { CimitTone, CimitVoice } from '@cimeat/types'
import { loadEnv } from '../env'
import { HttpError } from '../errors'
import { logger } from '../logger'
import { getOrUploadAudio, uploadBase64 } from './storage-service'

export type TtsResult = { audioUrl: string; text: string }

function inferStyle(text: string, tone: CimitTone): string {
  const lower = text.toLowerCase()
  if (/bagus|hebat|selamat|luar biasa|keren|mantap/.test(lower)) return '[positive] [enthusiasm]'
  if (/hati-hati|perlu|kurang|lebih|jaga|pastikan/.test(lower)) return '[concern]'
  if (/coba|bisa|yuk|ayo|saran/.test(lower)) return '[hope] [positive]'
  if (/roast|becanda|haha|lucu|ngakak/.test(lower)) return '[amusement] [laughs]'
  const toneMap: Record<CimitTone, string> = {
    soft: '[positive]',
    normal: '[amusement]',
    savage: '[frustration] [aggression]',
  }
  return toneMap[tone]
}

type WavOptions = { numChannels: number; sampleRate: number; bitsPerSample: number }

function parseAudioMime(mimeType: string): WavOptions {
  const [fileType, ...params] = mimeType.split(';').map((s) => s.trim())
  const format = fileType?.split('/')[1] ?? ''
  const options: WavOptions = { numChannels: 1, sampleRate: 24000, bitsPerSample: 16 }
  if (format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10)
    if (!Number.isNaN(bits)) options.bitsPerSample = bits
  }
  for (const param of params) {
    const [key, value] = param.split('=').map((s) => s.trim())
    if (key === 'rate' && value) options.sampleRate = parseInt(value, 10)
  }
  return options
}

function pcmToWav(base64Pcm: string, mimeType: string): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = parseAudioMime(mimeType)
  const data = Buffer.from(base64Pcm, 'base64')
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

async function synthGemini(
  text: string,
  tone: CimitTone,
  voiceName: string,
  signal?: AbortSignal,
): Promise<{ buffer: Buffer; mime: string }> {
  const env = loadEnv()
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  const scripted = `${inferStyle(text, tone)} ${text}`

  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL_TTS,
    config: {
      temperature: 1,
      responseModalities: ['audio'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
    contents: [{ role: 'user', parts: [{ text: scripted }] }],
  })

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
  const inline = part?.inlineData
  if (!inline?.data) throw new Error('gemini tts empty response')
  return { buffer: pcmToWav(inline.data, inline.mimeType ?? 'audio/L16;rate=24000'), mime: 'audio/wav' }
}

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
    let mime = 'audio/wav'

    if (env.TTS_PROVIDER === 'gemini') {
      const cacheKey = buildCacheKey(text, voiceName, 'gemini')
      const out = await synthGemini(text, tone, voiceName, signal)
      buffer = out.buffer
      mime = out.mime
      const audioUrl = await getOrUploadAudio(buffer, mime, cacheKey)
      return { audioUrl: audioUrl ?? '', text }
    }

    if (env.TTS_PROVIDER === 'elevenlabs') {
      if (!env.TTS_API_KEY) throw new HttpError(501, 'NOT_IMPLEMENTED', 'TTS belum dikonfigurasi')
      buffer = await synthElevenLabs(text, env.TTS_API_KEY, env.TTS_VOICE_ID ?? '')
    } else if (env.TTS_PROVIDER === 'openai') {
      if (!env.TTS_API_KEY) throw new HttpError(501, 'NOT_IMPLEMENTED', 'TTS belum dikonfigurasi')
      buffer = await synthOpenAI(text, env.TTS_API_KEY, env.TTS_VOICE_ID ?? '')
      mime = 'audio/mpeg'
    } else {
      throw new HttpError(501, 'NOT_IMPLEMENTED', 'TTS provider tidak didukung')
    }

    const audioUrl = await uploadBase64(buffer.toString('base64'), mime, 'audio')
    return { audioUrl: audioUrl ?? '', text }
  } catch (err) {
    if (err instanceof HttpError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    logger.error({ err, provider: env.TTS_PROVIDER }, 'tts synthesis failed')
    throw new HttpError(502, 'AI_ERROR', 'Gagal sintesis suara')
  }
}
