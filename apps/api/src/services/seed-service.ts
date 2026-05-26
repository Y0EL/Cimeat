import { and, eq, isNull } from 'drizzle-orm'
import { foods, nutritionGoals, type Database } from '@cimeat/db'
import { PRESET_FOODS } from '../constants'
import { computeGoalFromProfile, type ProfileMetrics } from './nutrition-util'

export async function ensurePresetFoods(db: Database): Promise<void> {
  const existing = await db
    .select({ id: foods.id })
    .from(foods)
    .where(and(isNull(foods.userId), eq(foods.isPreset, true)))
    .limit(1)
  if (existing.length > 0) return

  await db.insert(foods).values(
    PRESET_FOODS.map((f) => ({
      userId: null,
      name: f.name,
      category: f.category,
      servingLabel: f.servingLabel,
      calories: f.calories,
      protein: f.protein,
      carb: f.carb,
      fat: f.fat,
      icon: f.icon,
      isPreset: true,
    })),
  )
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function ensureUserDefaults(
  db: Database,
  userId: string,
  profile?: ProfileMetrics,
): Promise<void> {
  await ensurePresetFoods(db)

  const existingGoal = await db
    .select({ id: nutritionGoals.id })
    .from(nutritionGoals)
    .where(eq(nutritionGoals.userId, userId))
    .limit(1)

  if (existingGoal.length === 0) {
    const goal = computeGoalFromProfile(
      profile ?? {
        sex: null,
        birthYear: null,
        heightCm: null,
        weightKg: null,
        activityLevel: null,
        goalType: null,
      },
    )
    await db.insert(nutritionGoals).values({
      userId,
      calorieGoal: goal.calorieGoal,
      proteinGoal: goal.proteinGoal,
      carbGoal: goal.carbGoal,
      fatGoal: goal.fatGoal,
      goalType: goal.goalType,
      startsAt: todayUtc(),
    })
  }
}
