import { and, desc, eq, gte, ilike, inArray, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import { foodLogs, type Database, type FoodLog, type NewFoodLog } from '@cimeat/db'
import type {
  CreateFoodLogInput,
  FlexTrendItem,
  ListFoodLogsQuery,
  MealType,
  UpdateFoodLogInput,
} from '@cimeat/types'
import { HttpError } from '../errors'

export type Cursor = { eatenAt: string; id: string }

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.eatenAt}|${cursor.id}`).toString('base64url')
}

export function decodeCursor(raw: string): Cursor | null {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8')
    const idx = decoded.lastIndexOf('|')
    if (idx < 0) return null
    return { eatenAt: decoded.slice(0, idx), id: decoded.slice(idx + 1) }
  } catch {
    return null
  }
}

export async function listFoodLogs(
  db: Database,
  userId: string,
  query: ListFoodLogsQuery,
): Promise<{ rows: FoodLog[]; nextCursor: string | null }> {
  const conds: SQL[] = [eq(foodLogs.userId, userId)]
  if (query.from) conds.push(gte(foodLogs.eatenAt, new Date(query.from)))
  if (query.to) conds.push(lte(foodLogs.eatenAt, new Date(query.to)))
  if (query.mealType) conds.push(eq(foodLogs.mealType, query.mealType))
  if (query.q) conds.push(ilike(foodLogs.foodName, `%${query.q}%`))

  const cursor = query.cursor ? decodeCursor(query.cursor) : null
  if (cursor) {
    const at = new Date(cursor.eatenAt)
    const keyset = or(
      lt(foodLogs.eatenAt, at),
      and(eq(foodLogs.eatenAt, at), lt(foodLogs.id, cursor.id)),
    )
    if (keyset) conds.push(keyset)
  }

  const rows = await db
    .select()
    .from(foodLogs)
    .where(and(...conds))
    .orderBy(desc(foodLogs.eatenAt), desc(foodLogs.id))
    .limit(query.limit + 1)

  let nextCursor: string | null = null
  if (rows.length > query.limit) {
    const last = rows[query.limit - 1]!
    nextCursor = encodeCursor({ eatenAt: last.eatenAt.toISOString(), id: last.id })
    rows.length = query.limit
  }
  return { rows, nextCursor }
}

export type CreateFoodLogValues = Omit<NewFoodLog, 'userId' | 'id' | 'createdAt' | 'updatedAt'>

export async function insertFoodLog(
  db: Database,
  userId: string,
  values: CreateFoodLogValues,
): Promise<FoodLog> {
  const rows = await db
    .insert(foodLogs)
    .values({ ...values, userId })
    .returning()
  return rows[0]!
}

export async function createFoodLog(
  db: Database,
  userId: string,
  input: CreateFoodLogInput,
): Promise<FoodLog> {
  return insertFoodLog(db, userId, {
    foodId: input.foodId ?? null,
    source: input.source,
    mealType: input.mealType ?? null,
    foodName: input.foodName,
    estimatedWeightG: input.estimatedWeightG ?? null,
    calories: input.calories,
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
    healthScore: input.healthScore ?? null,
    confidenceScore: input.confidenceScore ?? null,
    imageUrl: input.imageUrl ?? null,
    audioUrl: input.audioUrl ?? null,
    note: input.note ?? null,
    rawAiResult: input.rawAiResult ?? null,
    eatenAt: new Date(input.eatenAt),
  })
}

export async function updateFoodLog(
  db: Database,
  userId: string,
  id: string,
  input: UpdateFoodLogInput,
): Promise<FoodLog> {
  const rows = await db
    .update(foodLogs)
    .set({
      ...(input.mealType !== undefined ? { mealType: input.mealType } : {}),
      ...(input.foodName !== undefined ? { foodName: input.foodName } : {}),
      ...(input.estimatedWeightG !== undefined ? { estimatedWeightG: input.estimatedWeightG } : {}),
      ...(input.calories !== undefined ? { calories: input.calories } : {}),
      ...(input.proteinG !== undefined ? { proteinG: input.proteinG } : {}),
      ...(input.carbsG !== undefined ? { carbsG: input.carbsG } : {}),
      ...(input.fatG !== undefined ? { fatG: input.fatG } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.eatenAt !== undefined ? { eatenAt: new Date(input.eatenAt) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, userId)))
    .returning()
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Catatan makan gak ketemu')
  return rows[0]!
}

export async function deleteFoodLog(db: Database, userId: string, id: string): Promise<void> {
  await db.delete(foodLogs).where(and(eq(foodLogs.id, id), eq(foodLogs.userId, userId)))
}

export async function bulkDeleteFoodLogs(
  db: Database,
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0
  const rows = await db
    .delete(foodLogs)
    .where(and(eq(foodLogs.userId, userId), inArray(foodLogs.id, ids)))
    .returning({ id: foodLogs.id })
  return rows.length
}

export function dayRange(date: string): { start: Date; end: Date } {
  const start = new Date(`${date}T00:00:00Z`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export type DayTotals = {
  calories: number
  protein: number
  carb: number
  fat: number
}

export async function getDayTotals(
  db: Database,
  userId: string,
  date: string,
): Promise<DayTotals> {
  const { start, end } = dayRange(date)
  const totals = await db
    .select({
      calories: sql<string>`coalesce(sum(${foodLogs.calories}), 0)::bigint`,
      protein: sql<string>`coalesce(sum(${foodLogs.proteinG}), 0)`,
      carb: sql<string>`coalesce(sum(${foodLogs.carbsG}), 0)`,
      fat: sql<string>`coalesce(sum(${foodLogs.fatG}), 0)`,
    })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, userId), gte(foodLogs.eatenAt, start), lt(foodLogs.eatenAt, end)))
  const t = totals[0]
  return {
    calories: Number(t?.calories ?? 0),
    protein: Number(t?.protein ?? 0),
    carb: Number(t?.carb ?? 0),
    fat: Number(t?.fat ?? 0),
  }
}

export async function getCaloriesByMealType(
  db: Database,
  userId: string,
  date: string,
): Promise<Array<{ mealType: MealType; calories: number }>> {
  const { start, end } = dayRange(date)
  const rows = await db
    .select({
      mealType: foodLogs.mealType,
      calories: sql<string>`coalesce(sum(${foodLogs.calories}), 0)::bigint`,
    })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, userId), gte(foodLogs.eatenAt, start), lt(foodLogs.eatenAt, end)))
    .groupBy(foodLogs.mealType)

  const byTypeMap = new Map<MealType, number>()
  for (const r of rows) {
    if (r.mealType) byTypeMap.set(r.mealType, Number(r.calories))
  }
  return MEAL_TYPES.map((mealType) => ({ mealType, calories: byTypeMap.get(mealType) ?? 0 }))
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
  const labelFormat = period === 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD'
  const unitLiteral = sql.raw(`'${truncUnit}'`)
  const formatLiteral = sql.raw(`'${labelFormat}'`)
  const truncSql = sql`date_trunc(${unitLiteral}, ${foodLogs.eatenAt} AT TIME ZONE 'UTC')`
  const labelSql = sql<string>`to_char(date_trunc(${unitLiteral}, ${foodLogs.eatenAt} AT TIME ZONE 'UTC'), ${formatLiteral})`

  const rows = await db
    .select({
      label: labelSql,
      calories: sql<string>`coalesce(sum(${foodLogs.calories}), 0)::bigint`,
      protein: sql<string>`coalesce(sum(${foodLogs.proteinG}), 0)`,
      carb: sql<string>`coalesce(sum(${foodLogs.carbsG}), 0)`,
      fat: sql<string>`coalesce(sum(${foodLogs.fatG}), 0)`,
    })
    .from(foodLogs)
    .where(
      and(eq(foodLogs.userId, userId), gte(foodLogs.eatenAt, fromDate), lte(foodLogs.eatenAt, toDate)),
    )
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

export async function recentFoodLogs(
  db: Database,
  userId: string,
  limit: number,
): Promise<FoodLog[]> {
  return db
    .select()
    .from(foodLogs)
    .where(eq(foodLogs.userId, userId))
    .orderBy(desc(foodLogs.eatenAt), desc(foodLogs.id))
    .limit(limit)
}
