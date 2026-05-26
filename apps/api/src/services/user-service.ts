import { eq } from 'drizzle-orm'
import { users, type Database, type User } from '@cimeat/db'
import type { UpdateProfileInput } from '@cimeat/types'
import type { ProfileMetrics } from './nutrition-util'

export type AuthClaims = {
  firebaseUid: string
  email: string | null
  name: string | null
}

export async function upsertUserByFirebase(db: Database, claims: AuthClaims): Promise<string> {
  const rows = await db
    .insert(users)
    .values({
      firebaseUid: claims.firebaseUid,
      email: claims.email,
      name: claims.name,
    })
    .onConflictDoUpdate({
      target: users.firebaseUid,
      set: { email: claims.email, name: claims.name },
    })
    .returning({ id: users.id })
  return rows[0]!.id
}

export async function getUser(db: Database, userId: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return rows[0] ?? null
}

export function profileMetrics(user: User): ProfileMetrics {
  return {
    sex: user.sex,
    birthYear: user.birthYear,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    activityLevel: user.activityLevel,
    goalType: user.goalType,
  }
}

export async function updateUserProfile(
  db: Database,
  userId: string,
  input: UpdateProfileInput,
): Promise<User> {
  const rows = await db
    .update(users)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sex !== undefined ? { sex: input.sex } : {}),
      ...(input.birthYear !== undefined ? { birthYear: input.birthYear } : {}),
      ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
      ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
      ...(input.activityLevel !== undefined ? { activityLevel: input.activityLevel } : {}),
      ...(input.goalType !== undefined ? { goalType: input.goalType } : {}),
      ...(input.cimitTone !== undefined ? { cimitTone: input.cimitTone } : {}),
      ...(input.defaultMode !== undefined ? { defaultMode: input.defaultMode } : {}),
    })
    .where(eq(users.id, userId))
    .returning()
  return rows[0]!
}
