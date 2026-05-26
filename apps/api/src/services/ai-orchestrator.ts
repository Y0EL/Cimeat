import { GoogleGenerativeAI, type Part } from '@google/generative-ai'
import type { z } from 'zod'
import { loadEnv } from '../env'
import { HttpError } from '../errors'
import { logger } from '../logger'

let genAI: GoogleGenerativeAI | null = null

export function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(loadEnv().GEMINI_API_KEY)
  return genAI
}

export function stripFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

type GenerateJsonOpts<T> = {
  model: string
  systemInstruction: string
  parts: Part[]
  schema: z.ZodType<T>
  label: string
}

export async function generateJson<T>(opts: GenerateJsonOpts<T>): Promise<T> {
  const model = getGenAI().getGenerativeModel({
    model: opts.model,
    systemInstruction: opts.systemInstruction,
    generationConfig: { responseMimeType: 'application/json' },
  })

  const attempt = async (extraParts: Part[]): Promise<{ raw: string; parsed: unknown } | null> => {
    const result = await model.generateContent([...opts.parts, ...extraParts])
    const raw = result.response.text()
    try {
      return { raw, parsed: JSON.parse(stripFence(raw)) }
    } catch {
      return { raw, parsed: null }
    }
  }

  const first = await attempt([])
  if (first?.parsed !== null && first?.parsed !== undefined) {
    const validated = opts.schema.safeParse(first.parsed)
    if (validated.success) return validated.data

    logger.warn({ label: opts.label, issues: validated.error.issues }, 'ai json invalid, repairing')
    const repairPrompt: Part = {
      text: `JSON sebelumnya tidak valid. Error: ${JSON.stringify(validated.error.issues)}. Output JSON yang BENAR sesuai kontrak, tanpa teks lain.`,
    }
    const second = await attempt([{ text: first.raw }, repairPrompt])
    if (second?.parsed !== null && second?.parsed !== undefined) {
      const reValidated = opts.schema.safeParse(second.parsed)
      if (reValidated.success) return reValidated.data
      logger.error({ label: opts.label, issues: reValidated.error.issues }, 'ai repair failed validation')
    }
  } else {
    logger.warn({ label: opts.label }, 'ai json parse failed, repairing')
    const second = await attempt([
      { text: 'Output sebelumnya bukan JSON valid. Ulangi sebagai JSON murni tanpa markdown fence.' },
    ])
    if (second?.parsed !== null && second?.parsed !== undefined) {
      const reValidated = opts.schema.safeParse(second.parsed)
      if (reValidated.success) return reValidated.data
    }
  }

  throw new HttpError(502, 'AI_ERROR', 'Gagal memproses respons AI')
}

export async function generateText(opts: {
  model: string
  systemInstruction: string
  parts: Part[]
}): Promise<string> {
  const model = getGenAI().getGenerativeModel({
    model: opts.model,
    systemInstruction: opts.systemInstruction,
  })
  const result = await model.generateContent(opts.parts)
  return result.response.text().trim()
}
