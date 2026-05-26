import { meals, type Database } from '@cimeat/db'
import type { ParsedFoodEntry } from '@cimeat/chat-core'
import { detectMealType } from '@cimeat/chat-core'
import type { MealType } from '@cimeat/types'

type MealSource = 'mobile' | 'telegram' | 'whatsapp' | 'photo' | 'chat' | 'manual' | 'recipe'

export type ChatSource = 'telegram' | 'whatsapp'

export type RecordedMeal = {
  name: string
  mealType: MealType
  calories: number
  protein: number
  carb: number
  fat: number
  servings: number
}

export type AgentMealInput = {
  name: string
  mealType?: string
  calories?: number
  protein?: number
  carb?: number
  fat?: number
  servings?: number
}

/** Heuristic meal type from the current hour when not specified. */
function mealTypeByClock(): MealType {
  const hour = (new Date().getUTCHours() + 7) % 24 // Asia/Jakarta
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

function coerceMealType(value: string | null | undefined): MealType {
  if (value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack') {
    return value
  }
  return mealTypeByClock()
}

async function insertMeal(
  db: Database,
  userId: string,
  values: {
    name: string
    mealType: MealType
    calories: number
    protein: number
    carb: number
    fat: number
    servings: number
    source: MealSource
  },
): Promise<RecordedMeal> {
  const rows = await db
    .insert(meals)
    .values({
      userId,
      mealType: values.mealType,
      name: values.name,
      servings: values.servings,
      calories: Math.max(0, Math.round(values.calories)),
      protein: Math.max(0, values.protein),
      carb: Math.max(0, values.carb),
      fat: Math.max(0, values.fat),
      loggedAt: new Date(),
      source: values.source,
    })
    .returning()
  const row = rows[0]!
  return {
    name: row.name,
    mealType: row.mealType,
    calories: row.calories,
    protein: row.protein,
    carb: row.carb,
    fat: row.fat,
    servings: row.servings,
  }
}

/** Record a meal from free-text parsed by the chat-core regex parser. */
export async function recordChatMeal(
  db: Database,
  userId: string,
  parsed: ParsedFoodEntry,
  rawText: string,
  source: ChatSource,
): Promise<RecordedMeal> {
  return insertMeal(db, userId, {
    name: parsed.name,
    mealType: parsed.mealType ?? coerceMealType(detectMealType(rawText)),
    calories: parsed.calories ?? 0,
    protein: 0,
    carb: 0,
    fat: 0,
    servings: 1,
    source,
  })
}

/** Record a meal from the AI agent's function call. */
export async function saveAgentMeal(
  db: Database,
  userId: string,
  input: AgentMealInput,
  source: MealSource,
): Promise<RecordedMeal> {
  return insertMeal(db, userId, {
    name: input.name,
    mealType: coerceMealType(input.mealType),
    calories: input.calories ?? 0,
    protein: input.protein ?? 0,
    carb: input.carb ?? 0,
    fat: input.fat ?? 0,
    servings: input.servings ?? 1,
    source,
  })
}
