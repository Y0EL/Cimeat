import type {
  CoachMessage as CoachMessageRow,
  Food as FoodRow,
  Meal as MealRow,
  NutritionGoal as NutritionGoalRow,
  User as UserRow,
} from '@cimeat/db'
import type {
  CoachMessageDto,
  FoodDto,
  MealDto,
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

export function toMealDto(r: MealRow): MealDto {
  return {
    id: r.id,
    foodId: r.foodId,
    mealType: r.mealType,
    name: r.name,
    servings: r.servings,
    calories: r.calories,
    protein: r.protein,
    carb: r.carb,
    fat: r.fat,
    note: r.note,
    photoUrl: r.photoUrl,
    loggedAt: r.loggedAt.toISOString(),
    source: r.source,
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
    isSubscribed: r.isSubscribed,
  }
}

export function toCoachMessageDto(r: CoachMessageRow): CoachMessageDto {
  return {
    id: r.id,
    role: r.role === 'user' ? 'user' : 'model',
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  }
}
