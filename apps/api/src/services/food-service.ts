import { and, asc, eq, ilike, isNull, or, type SQL } from 'drizzle-orm'
import { foods, type Database, type Food } from '@cimeat/db'
import type { CreateFoodInput, UpdateFoodInput } from '@cimeat/types'
import { HttpError } from '../errors'

export async function listFoods(db: Database, userId: string, q?: string): Promise<Food[]> {
  const ownership = or(isNull(foods.userId), eq(foods.userId, userId))!
  const conds: SQL[] = [ownership]
  if (q && q.trim().length > 0) {
    conds.push(ilike(foods.name, `%${q.trim()}%`))
  }
  return db
    .select()
    .from(foods)
    .where(and(...conds))
    .orderBy(asc(foods.name))
}

export async function createFood(
  db: Database,
  userId: string,
  input: CreateFoodInput,
): Promise<Food> {
  const rows = await db
    .insert(foods)
    .values({
      userId,
      name: input.name,
      category: input.category,
      servingLabel: input.servingLabel,
      calories: input.calories,
      protein: input.protein,
      carb: input.carb,
      fat: input.fat,
      icon: input.icon ?? null,
      isPreset: false,
    })
    .returning()
  return rows[0]!
}

export async function updateFood(
  db: Database,
  userId: string,
  id: string,
  input: UpdateFoodInput,
): Promise<Food> {
  const rows = await db
    .update(foods)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.servingLabel !== undefined ? { servingLabel: input.servingLabel } : {}),
      ...(input.calories !== undefined ? { calories: input.calories } : {}),
      ...(input.protein !== undefined ? { protein: input.protein } : {}),
      ...(input.carb !== undefined ? { carb: input.carb } : {}),
      ...(input.fat !== undefined ? { fat: input.fat } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.isFavorite !== undefined ? { isFavorite: input.isFavorite } : {}),
    })
    .where(and(eq(foods.id, id), eq(foods.userId, userId)))
    .returning()
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND', 'Makanan gak ketemu')
  return rows[0]!
}

export async function deleteFood(db: Database, userId: string, id: string): Promise<void> {
  await db.delete(foods).where(and(eq(foods.id, id), eq(foods.userId, userId)))
}
