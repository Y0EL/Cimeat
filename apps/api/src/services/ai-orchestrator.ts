import OpenAI, { toFile } from 'openai'
import type { z } from 'zod'
import { loadEnv } from '../env'
import { HttpError } from '../errors'
import { logger } from '../logger'

let _client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: loadEnv().OPENAI_API_KEY })
  return _client
}

export function stripFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; mimeType: string; data: string }
  | { type: 'audio'; mimeType: string; data: string }

type GenerateJsonOpts<T> = {
  systemInstruction: string
  parts: ContentPart[]
  schema: z.ZodType<T>
  label: string
}

function partsToUserContent(parts: ContentPart[]): OpenAI.ChatCompletionContentPart[] {
  const result: OpenAI.ChatCompletionContentPart[] = []
  for (const p of parts) {
    if (p.type === 'text') {
      result.push({ type: 'text', text: p.text })
    } else if (p.type === 'image') {
      result.push({
        type: 'image_url',
        image_url: { url: `data:${p.mimeType};base64,${p.data}` },
      })
    }
  }
  return result
}

function chooseModel(parts: ContentPart[]): string {
  if (parts.some((p) => p.type === 'image')) return 'gpt-4o'
  return 'gpt-4o-mini'
}

export async function whisperTranscribe(audioData: string, mimeType: string): Promise<string> {
  const buffer = Buffer.from(audioData, 'base64')
  let ext = 'mp3'
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'mp4'
  else if (mimeType.includes('wav')) ext = 'wav'
  else if (mimeType.includes('webm')) ext = 'webm'
  else if (mimeType.includes('ogg')) ext = 'ogg'
  const file = await toFile(buffer, `audio.${ext}`, { type: mimeType })
  const result = await getOpenAI().audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'id',
  })
  return result.text.trim()
}

export async function generateJson<T>(opts: GenerateJsonOpts<T>): Promise<T> {
  const model = chooseModel(opts.parts)
  const userContent = partsToUserContent(opts.parts)

  const attempt = async (extraText?: string): Promise<{ raw: string; parsed: unknown } | null> => {
    const content: OpenAI.ChatCompletionContentPart[] = [...userContent]
    if (extraText) content.push({ type: 'text', text: extraText })

    const completion = await getOpenAI().chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: opts.systemInstruction },
        { role: 'user', content },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    try {
      return { raw, parsed: JSON.parse(stripFence(raw)) }
    } catch {
      return { raw, parsed: null }
    }
  }

  const first = await attempt()
  if (first?.parsed !== null && first?.parsed !== undefined) {
    const validated = opts.schema.safeParse(first.parsed)
    if (validated.success) return validated.data

    logger.warn({ label: opts.label, issues: validated.error.issues }, 'ai json invalid, repairing')
    const repairText = `JSON sebelumnya tidak valid. Error: ${JSON.stringify(validated.error.issues)}. Output JSON yang BENAR sesuai kontrak, tanpa teks lain.`
    const second = await attempt(`${first.raw}\n${repairText}`)
    if (second?.parsed !== null && second?.parsed !== undefined) {
      const reValidated = opts.schema.safeParse(second.parsed)
      if (reValidated.success) return reValidated.data
      logger.error({ label: opts.label, issues: reValidated.error.issues }, 'ai repair failed validation')
    }
  } else {
    logger.warn({ label: opts.label }, 'ai json parse failed, repairing')
    const second = await attempt(
      'Output sebelumnya bukan JSON valid. Ulangi sebagai JSON murni tanpa markdown fence.',
    )
    if (second?.parsed !== null && second?.parsed !== undefined) {
      const reValidated = opts.schema.safeParse(second.parsed)
      if (reValidated.success) return reValidated.data
    }
  }

  throw new HttpError(502, 'AI_ERROR', 'Gagal memproses respons AI')
}

export async function generateText(opts: {
  systemInstruction: string
  parts: ContentPart[]
}): Promise<string> {
  const model = chooseModel(opts.parts)
  const userContent = partsToUserContent(opts.parts)

  const completion = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: 'system', content: opts.systemInstruction },
      { role: 'user', content: userContent },
    ],
  })

  return completion.choices[0]?.message?.content?.trim() ?? ''
}
