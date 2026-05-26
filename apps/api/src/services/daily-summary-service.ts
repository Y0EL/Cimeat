import { dailySummaries, type Database } from '@cimeat/db'
import type { DailySummary, NutritionGoalDto } from '@cimeat/types'
import { getCaloriesByMealType, getDayTotals } from './foodlog-service'

export async function getDailySummary(
  db: Database,
  userId: string,
  date: string,
  goal: NutritionGoalDto,
): Promise<DailySummary> {
  const consumed = await getDayTotals(db, userId, date)
  const byMealType = await getCaloriesByMealType(db, userId, date)

  const offsideAmount = Math.max(0, Math.round(consumed.calories - goal.calorieGoal))

  return {
    date,
    goal,
    consumed,
    remaining: {
      calories: goal.calorieGoal - consumed.calories,
      protein: goal.proteinGoal - consumed.protein,
      carb: goal.carbGoal - consumed.carb,
      fat: goal.fatGoal - consumed.fat,
    },
    offsideAmount,
    byMealType,
  }
}

export async function upsertDailySummary(
  db: Database,
  userId: string,
  date: string,
  goal: NutritionGoalDto,
): Promise<void> {
  const consumed = await getDayTotals(db, userId, date)
  const offsideAmount = Math.max(0, Math.round(consumed.calories - goal.calorieGoal))

  await db
    .insert(dailySummaries)
    .values({
      userId,
      summaryDate: date,
      totalCalories: Math.round(consumed.calories),
      totalProteinG: consumed.protein,
      totalCarbsG: consumed.carb,
      totalFatG: consumed.fat,
      offsideAmount,
    })
    .onConflictDoUpdate({
      target: [dailySummaries.userId, dailySummaries.summaryDate],
      set: {
        totalCalories: Math.round(consumed.calories),
        totalProteinG: consumed.protein,
        totalCarbsG: consumed.carb,
        totalFatG: consumed.fat,
        offsideAmount,
      },
    })
}
