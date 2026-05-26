import { and, desc, eq, gte, ilike, inArray, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import { foods, meals, type Database, type Meal } from '@cimeat/db'
import type {
  CreateMealInput,
  DailySummary,
  FlexTrendItem,
  ListMealsQuery,
  MealType,
  NutritionGoalDto,
  UpdateMealInput,
} from '@cimeat/types'
import { HttpError } from '../errors'

export type Cursor = { loggedAt: string; id: string }

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.loggedAt}|${cursor.id}`).toString('base64url')
}

export function decodeCursor(raw: string): Cursor | null {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8')
    const idx = decoded.lastIndexOf('|')
    if (idx < 0) return null
    return { loggedAt: decoded.slice(0, idx), id: decoded.slice(idx + 1) }
  } catch {
    return null
  }
}

export async function listMeals(
  db: Database,
  userId: string,
  query: ListMealsQuery,
): Promise<{ rows: Meal[]; nextCursor: string | null }> {
  const conds: SQL[] = [eq(meals.userId, userId)]
  if (query.from) conds.push(gte(meals.loggedAt, new Date(query.from)))
  if (query.to) conds.push(lte(meals.loggedAt, new Date(query.to)))
  if (query.mealType) conds.push(eq(meals.mealType, query.mealType))
  if (query.q) {
    const match = ilike(meals.name, `%${query.q}%`)
    conds.push(match)
  }

  const cursor = query.cursor ? decodeCursor(query.cursor) : null
  if (cursor) {
    const at = new Date(cursor.loggedAt)
    const keyset = or(
      lt(meals.loggedAt, at),
      and(eq(meals.loggedAt, at), lt(meals.id, cursor.id)),
    )
    if (keyset) conds.push(keyset)
  }

  const rows = await db
    .select()
    .from(meals)
    .where(and(...conds))
    .orderBy(desc(meals.loggedAt), desc(meals.id))
    .limit(query.limit + 1)

  let nextCursor: string | null = null
  if (rows.length > query.limit) {
    const last = rows[query.limit - 1]!
    nextCursor = encodeCursor({ loggedAt: last.loggedAt.toISOString(), id: last.id })
    rows.length = query.limit
  }
  return { rows, nextCursor }
}

export type MealMacros = {
  calories: number
  protein: number
  carb: number
  fat: number
}

/**
 * Resolve the final macros for a meal entry. When calories aren't provided and a
 * foodId is given, derive from the food's per-serving macros * servings.
 */
async function resolveMacros(
  db: Database,
  userId: string,
  input: CreateMealInput,
): Promise<MealMacros> {
  const servings = input.servings
  const hasExplicit = input.calories > 0 || input.protein > 0 || input.carb > 0 || input.fat > 0

  if (!hasExplicit && input.foodId) {
    const rows = await db
      .select()
      .from(foods)
      .where(and(eq(foods.id, input.foodId), or(eq(foods.userId, userId), sql`${foods.userId} is null`)!))
      .limit(1)
    const food = rows[0]
    if (food) {
      return {
        calories: Math.round(food.calories * servings),
        protein: food.protein * servings,
        carb: food.carb * servings,
        fat: food.fat * servings,
      }
    }
  }

  return {
    calories: input.calories,
    protein: input.protein,
    carb: input.carb,
    fat: input.fat,
  }
}

export async function createMeal(
  db: Database,
  userId: string,
  input: CreateMealInput,
): Promise<Meal> {
  const macros = await resolveMacros(db, userId, input)
  const rows = await db
    .insert(meals)
    .values({
      userId,
      foodId: input.foodId ?? null,
      mealType: input.mealType,
      name: input.name,
      servings: input.servings,
      calories: macros.calories,
      protein: macros.protein,
      carb: macros.carb,
      fat: macros.fat,
      note: input.note ?? null,
      photoUrl: input.photoUrl ?? null,
      loggedAt: new Date(input.loggedAt),
      source: input.source,
    })
    .returning()
  return rows[0]!
}

export async function updateMeal(
  db: Database,
  userId: string,
  id: string,
  input: UpdateMealInput,
): Promise<Meal> {
  const rows = await db
    .update(meals)
    .set({
      ...(input.mealType !== undefined ? { mealType: input.mealType } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.servings !== undefined ? { servings: input.servings } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.loggedAt !== undefined ? { loggedAt: new Date(input.loggedAt) } : {}),
      ...(input.calories !== undefined ? { calories: input.calories } : {}),
      ...(input.protein !== undefined ? { protein: input.protein } : {}),
      ...(input.carb !== undefined ? { carb: input.carb } : {}),
      ...(input.fat !== undefined ? { fat: input.fat } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(meals.id, id), eq(meals.userId, userId)))
    .returning()
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Makanan gak ketemu')
  return rows[0]!
}

export async function deleteMeal(db: Database, userId: string, id: string): Promise<void> {
  await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)))
}

export async function bulkDeleteMeals(
  db: Database,
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0
  const rows = await db
    .delete(meals)
    .where(and(eq(meals.userId, userId), inArray(meals.id, ids)))
    .returning({ id: meals.id })
  return rows.length
}

// ---------------------------------------------------------------------------
// Summary & trends
// ---------------------------------------------------------------------------
function dayRange(date: string): { start: Date; end: Date } {
  const start = new Date(`${date}T00:00:00Z`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export async function getDailySummary(
  db: Database,
  userId: string,
  date: string,
  goal: NutritionGoalDto,
): Promise<DailySummary> {
  const { start, end } = dayRange(date)

  const totals = await db
    .select({
      calories: sql<string>`coalesce(sum(${meals.calories}), 0)::bigint`,
      protein: sql<string>`coalesce(sum(${meals.protein}), 0)`,
      carb: sql<string>`coalesce(sum(${meals.carb}), 0)`,
      fat: sql<string>`coalesce(sum(${meals.fat}), 0)`,
    })
    .from(meals)
    .where(and(eq(meals.userId, userId), gte(meals.loggedAt, start), lt(meals.loggedAt, end)))

  const t = totals[0]
  const consumed = {
    calories: Number(t?.calories ?? 0),
    protein: Number(t?.protein ?? 0),
    carb: Number(t?.carb ?? 0),
    fat: Number(t?.fat ?? 0),
  }

  const byTypeRows = await db
    .select({
      mealType: meals.mealType,
      calories: sql<string>`coalesce(sum(${meals.calories}), 0)::bigint`,
    })
    .from(meals)
    .where(and(eq(meals.userId, userId), gte(meals.loggedAt, start), lt(meals.loggedAt, end)))
    .groupBy(meals.mealType)

  const byTypeMap = new Map<MealType, number>()
  for (const r of byTypeRows) byTypeMap.set(r.mealType, Number(r.calories))
  const byMealType = MEAL_TYPES.map((mealType) => ({
    mealType,
    calories: byTypeMap.get(mealType) ?? 0,
  }))

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
    byMealType,
  }
}

export async function getFlexTrend(
  db: Database,
  userId: string,
  period: 'daily' | 'weekly' | 'monthly',
  from: string,
  to: string,
): Promise<FlexTrendItem[]> {
  const fromDate = new Date(`${from}T00:00:00Z`)
  const toDate = new Date(`${to}T23:59:59Z`)

  const truncUnit = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'
  const truncSql = sql`date_trunc(${truncUnit}, ${meals.loggedAt} AT TIME ZONE 'UTC')`
  const labelFormat = period === 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD'
  const labelSql = sql<string>`to_char(date_trunc(${truncUnit}, ${meals.loggedAt} AT TIME ZONE 'UTC'), ${labelFormat})`

  const rows = await db
    .select({
      label: labelSql,
      calories: sql<string>`coalesce(sum(${meals.calories}), 0)::bigint`,
      protein: sql<string>`coalesce(sum(${meals.protein}), 0)`,
      carb: sql<string>`coalesce(sum(${meals.carb}), 0)`,
      fat: sql<string>`coalesce(sum(${meals.fat}), 0)`,
    })
    .from(meals)
    .where(and(eq(meals.userId, userId), gte(meals.loggedAt, fromDate), lte(meals.loggedAt, toDate)))
    .groupBy(truncSql, labelSql)
    .orderBy(truncSql)

  const map = new Map<string, FlexTrendItem>()

  if (period === 'daily') {
    const cur = new Date(fromDate)
    while (cur <= toDate) {
      const label = cur.toISOString().slice(0, 10)
      map.set(label, { label, calories: 0, protein: 0, carb: 0, fat: 0 })
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
  } else if (period === 'weekly') {
    const cur = new Date(fromDate)
    const dow = cur.getUTCDay()
    cur.setUTCDate(cur.getUTCDate() - (dow === 0 ? 6 : dow - 1))
    while (cur <= toDate) {
      const label = cur.toISOString().slice(0, 10)
      map.set(label, { label, calories: 0, protein: 0, carb: 0, fat: 0 })
      cur.setUTCDate(cur.getUTCDate() + 7)
    }
  } else {
    const cur = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 1))
    const last = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), 1))
    while (cur <= last) {
      const label = cur.toISOString().slice(0, 7)
      map.set(label, { label, calories: 0, protein: 0, carb: 0, fat: 0 })
      cur.setUTCMonth(cur.getUTCMonth() + 1)
    }
  }

  for (const row of rows) {
    const bucket = map.get(row.label)
    if (!bucket) continue
    bucket.calories = Number(row.calories)
    bucket.protein = Number(row.protein)
    bucket.carb = Number(row.carb)
    bucket.fat = Number(row.fat)
  }

  return Array.from(map.values())
}

/** Last N meals (used by the coach agent). */
export async function recentMeals(db: Database, userId: string, limit: number): Promise<Meal[]> {
  return db
    .select()
    .from(meals)
    .where(eq(meals.userId, userId))
    .orderBy(desc(meals.loggedAt), desc(meals.id))
    .limit(limit)
}
