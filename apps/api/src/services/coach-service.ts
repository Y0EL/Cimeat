import { and, desc, eq, lt } from 'drizzle-orm'
import { coachMessages, type Database, type CoachMessage } from '@cimeat/db'

export async function saveCoachMessages(
  db: Database,
  userId: string,
  messages: Array<{ role: 'user' | 'model'; content: string }>,
): Promise<void> {
  if (messages.length === 0) return
  await db.insert(coachMessages).values(messages.map((m) => ({ userId, role: m.role, content: m.content })))
}

export async function getCoachHistory(
  db: Database,
  userId: string,
  limit: number,
  before?: Date,
): Promise<CoachMessage[]> {
  const conds = [eq(coachMessages.userId, userId)]
  if (before) conds.push(lt(coachMessages.createdAt, before))
  const rows = await db
    .select()
    .from(coachMessages)
    .where(and(...conds))
    .orderBy(desc(coachMessages.createdAt))
    .limit(limit)
  // Return in chronological order (oldest first) for chat rendering.
  return rows.reverse()
}
