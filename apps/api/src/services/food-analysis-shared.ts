import type { Database, FoodLog } from '@cimeat/db'
import type { FoodAnalysis, FoodLogSource, MealType } from '@cimeat/types'
import { insertFoodLog, type CreateFoodLogValues } from './foodlog-service'

export function mealTypeByClock(): MealType {
  const hour = (new Date().getUTCHours() + 7) % 24
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

type AnalysisLogOpts = {
  mealType?: MealType | undefined
  imageUrl?: string | null | undefined
  audioUrl?: string | null | undefined
  note?: string | null | undefined
}

export function foodAnalysisToLogValues(
  analysis: FoodAnalysis,
  source: FoodLogSource,
  opts: AnalysisLogOpts = {},
): CreateFoodLogValues {
  return {
    source,
    mealType: opts.mealType ?? mealTypeByClock(),
    foodName: analysis.food_name,
    estimatedWeightG: analysis.estimated_weight_g,
    calories: Math.max(0, Math.round(analysis.calories)),
    proteinG: Math.max(0, analysis.macronutrients.protein_g),
    carbsG: Math.max(0, analysis.macronutrients.carbs_g),
    fatG: Math.max(0, analysis.macronutrients.fat_g),
    healthScore: analysis.health_score,
    confidenceScore: analysis.confidence_score,
    imageUrl: opts.imageUrl ?? null,
    audioUrl: opts.audioUrl ?? null,
    note: opts.note ?? null,
    rawAiResult: analysis,
    eatenAt: new Date(),
  }
}

export async function saveAnalysisLog(
  db: Database,
  userId: string,
  args: {
    analysis: FoodAnalysis
    source: FoodLogSource
  } & AnalysisLogOpts,
): Promise<FoodLog> {
  return insertFoodLog(
    db,
    userId,
    foodAnalysisToLogValues(args.analysis, args.source, {
      mealType: args.mealType,
      imageUrl: args.imageUrl,
      audioUrl: args.audioUrl,
      note: args.note,
    }),
  )
}
