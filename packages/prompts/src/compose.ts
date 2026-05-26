import type { CimitTone } from '@cimeat/types'
import { cimitPersonaSystem, nutritionExpertSystem, safetyRulesSystem } from './system'

type ComposeOpts = {
  includeNutrition?: boolean
  includePersona?: boolean
  includeSafety?: boolean
  tone?: CimitTone
}

export function composeSystemPrompt(task: string, opts: ComposeOpts = {}): string {
  const {
    includeNutrition = true,
    includePersona = false,
    includeSafety = true,
    tone = 'normal',
  } = opts
  const parts: string[] = []
  if (includeSafety) parts.push(safetyRulesSystem)
  if (includeNutrition) parts.push(nutritionExpertSystem)
  if (includePersona) parts.push(cimitPersonaSystem(tone))
  parts.push(task)
  return parts.join('\n\n---\n\n')
}
