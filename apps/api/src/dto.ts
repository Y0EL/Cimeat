import type {
  CimitMessage as CimitMessageRow,
  Food as FoodRow,
  FoodLog as FoodLogRow,
  NutritionGoal as NutritionGoalRow,
  User as UserRow,
} from '@cimeat/db'
import type {
  CimitMessageDto,
  FoodDto,
  FoodLogDto,
  NutritionGoalDto,
  UserProfile,
} from '@cimeat/types'

export function toFoodDto(r: FoodRow): FoodDto {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    servingLabel: r.servingLabel,
    calories: r.calories,
    protein: r.protein,
    carb: r.carb,
    fat: r.fat,
    icon: r.icon,
    isPreset: r.isPreset,
    isFavorite: r.isFavorite,
  }
}

export function toFoodLogDto(r: FoodLogRow): FoodLogDto {
  return {
    id: r.id,
    foodId: r.foodId,
    source: r.source,
    mealType: r.mealType,
    foodName: r.foodName,
    estimatedWeightG: r.estimatedWeightG,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    healthScore: r.healthScore,
    confidenceScore: r.confidenceScore,
    imageUrl: r.imageUrl,
    audioUrl: r.audioUrl,
    note: r.note,
    eatenAt: r.eatenAt.toISOString(),
  }
}

export function toNutritionGoalDto(r: NutritionGoalRow): NutritionGoalDto {
  return {
    calorieGoal: r.calorieGoal,
    proteinGoal: r.proteinGoal,
    carbGoal: r.carbGoal,
    fatGoal: r.fatGoal,
    goalType: r.goalType,
  }
}

export function toUserProfileDto(r: UserRow): UserProfile {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    locale: r.locale,
    sex: r.sex,
    birthYear: r.birthYear,
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    activityLevel: r.activityLevel,
    goalType: r.goalType,
    activePlan: r.activePlan,
    cimitTone: r.cimitTone,
    defaultMode: r.defaultMode,
  }
}

export function toCimitMessageDto(r: CimitMessageRow): CimitMessageDto {
  return {
    id: r.id,
    type: r.type,
    role: r.role === 'user' ? 'user' : 'model',
    content: r.content,
    tone: r.tone,
    audioUrl: r.audioUrl,
    createdAt: r.createdAt.toISOString(),
  }
}
