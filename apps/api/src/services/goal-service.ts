import { desc, eq } from 'drizzle-orm'
import { nutritionGoals, type Database, type NutritionGoal } from '@cimeat/db'
import type { NutritionGoalDto, UpsertNutritionGoalInput } from '@cimeat/types'
import { computeGoalFromProfile, defaultGoal, type ProfileMetrics } from './nutrition-util'

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Latest active nutrition goal (by startsAt desc) or null if none. */
export async function getActiveGoalRow(
  db: Database,
  userId: string,
): Promise<NutritionGoal | null> {
  const rows = await db
    .select()
    .from(nutritionGoals)
    .where(eq(nutritionGoals.userId, userId))
    .orderBy(desc(nutritionGoals.startsAt), desc(nutritionGoals.createdAt))
    .limit(1)
  return rows[0] ?? null
}

/** Returns the active goal as a DTO, falling back to a computed default. */
export async function getActiveGoal(
  db: Database,
  userId: string,
  profile?: ProfileMetrics,
): Promise<NutritionGoalDto> {
  const row = await getActiveGoalRow(db, userId)
  if (row) {
    return {
      calorieGoal: row.calorieGoal,
      proteinGoal: row.proteinGoal,
      carbGoal: row.carbGoal,
      fatGoal: row.fatGoal,
      goalType: row.goalType,
    }
  }
  return profile ? computeGoalFromProfile(profile) : defaultGoal()
}

/** Insert a new goal row effective today. */
export async function upsertGoal(
  db: Database,
  userId: string,
  input: UpsertNutritionGoalInput,
): Promise<NutritionGoal> {
  const rows = await db
    .insert(nutritionGoals)
    .values({
      userId,
      calorieGoal: input.calorieGoal,
      proteinGoal: input.proteinGoal,
      carbGoal: input.carbGoal,
      fatGoal: input.fatGoal,
      goalType: input.goalType,
      startsAt: todayUtc(),
    })
    .returning()
  return rows[0]!
}

/** Persist a computed suggested goal for the user (used when profile metrics change). */
export async function applySuggestedGoal(
  db: Database,
  userId: string,
  goal: NutritionGoalDto,
): Promise<NutritionGoal> {
  const rows = await db
    .insert(nutritionGoals)
    .values({
      userId,
      calorieGoal: goal.calorieGoal,
      proteinGoal: goal.proteinGoal,
      carbGoal: goal.carbGoal,
      fatGoal: goal.fatGoal,
      goalType: goal.goalType,
      startsAt: todayUtc(),
    })
    .returning()
  return rows[0]!
}
