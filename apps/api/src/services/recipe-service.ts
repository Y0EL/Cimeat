import { desc, eq } from 'drizzle-orm'
import { composeSystemPrompt, generateRecipeTask } from '@cimeat/prompts'
import { recipes, type Database, type Recipe } from '@cimeat/db'
import {
  recipeResponseSchema,
  type CimitTone,
  type RecipeGenerateInput,
  type RecipeResponse,
} from '@cimeat/types'
import type { z } from 'zod'
import { loadEnv } from '../env'
import { generateJson } from './ai-orchestrator'

const recipeModelSchema = recipeResponseSchema.omit({ id: true, mode: true })

function buildPrompt(input: RecipeGenerateInput): string {
  const lines: string[] = [`Bahan yang dimiliki: ${input.ingredients.join(', ')}.`, `Mode: ${input.mode}.`]
  if (input.remaining_calories !== undefined) lines.push(`Sisa kalori hari ini: ${input.remaining_calories} kkal.`)
  if (input.remaining_protein_g !== undefined) lines.push(`Sisa protein: ${input.remaining_protein_g} g.`)
  if (input.budget !== undefined) lines.push(`Budget: Rp${input.budget}.`)
  if (input.tools?.length) lines.push(`Alat masak: ${input.tools.join(', ')}.`)
  if (input.avoid?.length) lines.push(`Pantangan: ${input.avoid.join(', ')}.`)
  return lines.join('\n')
}

export async function generateRecipe(
  db: Database,
  userId: string,
  input: RecipeGenerateInput,
  tone: CimitTone,
): Promise<RecipeResponse> {
  const env = loadEnv()
  const partial = await generateJson<z.infer<typeof recipeModelSchema>>({
    model: env.GEMINI_MODEL_CHAT,
    systemInstruction: composeSystemPrompt(generateRecipeTask, { includePersona: true, tone }),
    parts: [{ text: buildPrompt(input) }],
    schema: recipeModelSchema,
    label: 'recipe',
  })

  const rows = await db
    .insert(recipes)
    .values({
      userId,
      title: partial.title,
      mode: input.mode,
      ingredients: input.ingredients,
      recipeMarkdown: partial.recipe_markdown,
      nutritionEstimate: partial.nutrition_estimate,
    })
    .returning()
  const saved = rows[0]!

  return {
    id: saved.id,
    title: partial.title,
    mode: input.mode,
    recipe_markdown: partial.recipe_markdown,
    nutrition_estimate: partial.nutrition_estimate,
    ...(partial.cimit_message ? { cimit_message: partial.cimit_message } : {}),
  }
}

export async function listRecipes(db: Database, userId: string, limit = 50): Promise<Recipe[]> {
  return db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(desc(recipes.createdAt))
    .limit(limit)
}

export function toRecipeResponse(r: Recipe): RecipeResponse {
  const nutrition = recipeResponseSchema.shape.nutrition_estimate.safeParse(r.nutritionEstimate)
  return {
    id: r.id,
    title: r.title,
    mode: r.mode,
    recipe_markdown: r.recipeMarkdown,
    nutrition_estimate: nutrition.success
      ? nutrition.data
      : { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, servings: 1 },
  }
}
