import type { ActivityLevel, GoalType, NutritionGoalDto } from '@cimeat/types'

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const GOAL_CALORIE_ADJUSTMENT: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
}

const DEFAULT_GOAL: NutritionGoalDto = {
  calorieGoal: 2000,
  proteinGoal: 125,
  carbGoal: 250,
  fatGoal: 56,
  goalType: 'maintain',
}

export type ProfileMetrics = {
  sex: 'male' | 'female' | null
  birthYear: number | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: ActivityLevel | null
  goalType: GoalType | null
}

export function computeGoalFromProfile(profile: ProfileMetrics): NutritionGoalDto {
  const { sex, birthYear, heightCm, weightKg } = profile
  if (!sex || !birthYear || !heightCm || !weightKg) {
    return { ...DEFAULT_GOAL, goalType: profile.goalType ?? 'maintain' }
  }

  const age = new Date().getUTCFullYear() - birthYear
  if (age <= 0 || age > 130) {
    return { ...DEFAULT_GOAL, goalType: profile.goalType ?? 'maintain' }
  }

  const bmr =
    10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)

  const activity = ACTIVITY_FACTORS[profile.activityLevel ?? 'moderate']
  const goalType: GoalType = profile.goalType ?? 'maintain'
  const tdee = bmr * activity + GOAL_CALORIE_ADJUSTMENT[goalType]

  const calorieGoal = Math.max(1000, Math.round(tdee))

  const proteinGoal = Math.round(weightKg * 2)
  const fatGoal = Math.round((calorieGoal * 0.25) / 9)
  const remainingCalories = calorieGoal - proteinGoal * 4 - fatGoal * 9
  const carbGoal = Math.max(0, Math.round(remainingCalories / 4))

  return { calorieGoal, proteinGoal, carbGoal, fatGoal, goalType }
}

export function defaultGoal(): NutritionGoalDto {
  return { ...DEFAULT_GOAL }
}
