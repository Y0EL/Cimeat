export * from './system'
export * from './tasks'
export * from './compose'

import { cimitPersonaSystem } from './system'
import { analyzeImageTask, generateRecipeTask } from './tasks'

export const coachSystemPrompt = cimitPersonaSystem('normal')
export const foodVisionPrompt = analyzeImageTask
export const recipeSystemPrompt = generateRecipeTask
