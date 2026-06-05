import { safetyRulesSystem } from '@cimeat/prompts'
import { logger } from '../logger'
import { generateText } from './ai-orchestrator'

const UNSAFE_PATTERNS: RegExp[] = [
  /puasa\s+(total|ekstrem|seharian penuh)/i,
  /\bmuntah\b/i,
  /jangan makan (seharian|sama sekali)/i,
  /(gemuk|gendut|jelek|obesitas)\b/i,
  /\bdiet\s+ekstrem\b/i,
  /\b<?\s*800\s*kkal\b/i,
]

export function isUnsafe(text: string): boolean {
  return UNSAFE_PATTERNS.some((re) => re.test(text))
}

export async function ensureSafe(text: string): Promise<string> {
  if (!isUnsafe(text)) return text
  try {
    const rewritten = await generateText({
      systemInstruction: safetyRulesSystem,
      parts: [
        {
          type: 'text',
          text: `Tulis ulang teks berikut agar AMAN (tanpa body shaming, tanpa diet ekstrem/puasa total/muntah), tetap suportif dan fokus recovery. Pertahankan gaya santai. Output teksnya saja:\n\n${text}`,
        },
      ],
    })
    return rewritten || text
  } catch (err) {
    logger.warn({ err }, 'safety rewrite failed, returning original')
    return text
  }
}
