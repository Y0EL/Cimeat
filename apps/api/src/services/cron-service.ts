import cron, { type ScheduledTask } from 'node-cron'
import { Expo } from 'expo-server-sdk'
import { and, eq, gte, isNotNull, lt, sql } from 'drizzle-orm'
import { meals, notificationPrefs, type Database } from '@cimeat/db'
import { formatKcal } from '@cimeat/chat-core'
import { logger } from '../logger'

const TZ = 'Asia/Jakarta'
const expo = new Expo()

type Message = { token: string; title: string; body: string }

async function sendBatch(messages: Message[]): Promise<void> {
  const chunks = expo.chunkPushNotifications(
    messages
      .filter((m) => Expo.isExpoPushToken(m.token))
      .map((m) => ({ to: m.token, sound: 'default', title: m.title, body: m.body })),
  )
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk)
    } catch (err) {
      logger.error({ err }, 'gagal kirim batch push')
    }
  }
}

function startOfTodayJakarta(): Date {
  const now = new Date()
  const offsetMs = 7 * 60 * 60 * 1000
  const jakartaNow = new Date(now.getTime() + offsetMs)
  jakartaNow.setUTCHours(0, 0, 0, 0)
  return new Date(jakartaNow.getTime() - offsetMs)
}

function weekStartJakarta(now: Date = new Date()): Date {
  const offsetMs = 7 * 60 * 60 * 1000
  const jak = new Date(now.getTime() + offsetMs)
  const day = jak.getUTCDay()
  const diff = (day + 6) % 7
  jak.setUTCDate(jak.getUTCDate() - diff)
  jak.setUTCHours(0, 0, 0, 0)
  return new Date(jak.getTime() - offsetMs)
}

async function runMealReminder(db: Database): Promise<void> {
  const startToday = startOfTodayJakarta()
  const rows = await db
    .select({
      userId: notificationPrefs.userId,
      token: notificationPrefs.expoPushToken,
      mealCount: sql<string>`(
        select count(*) from ${meals}
        where ${meals.userId} = ${notificationPrefs.userId}
          and ${meals.loggedAt} >= ${startToday}
      )::int`,
    })
    .from(notificationPrefs)
    .where(and(eq(notificationPrefs.mealReminder, true), isNotNull(notificationPrefs.expoPushToken)))

  const messages: Message[] = []
  for (const r of rows) {
    if (!r.token) continue
    if (Number(r.mealCount) > 0) continue
    messages.push({
      token: r.token,
      title: 'Udah makan apa hari ini?',
      body: 'Belum ada catatan makan hari ini. Tulis "nasi goreng 600 kkal" aja udah cukup.',
    })
  }
  if (messages.length > 0) {
    logger.info({ count: messages.length }, 'kirim meal reminder')
    await sendBatch(messages)
  }
}

async function runWeeklyRecap(db: Database): Promise<void> {
  const weekStart = weekStartJakarta()
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select({
      userId: notificationPrefs.userId,
      token: notificationPrefs.expoPushToken,
      totalCalories: sql<string>`coalesce(sum(${meals.calories}), 0)::bigint`,
      mealCount: sql<string>`count(${meals.id})::int`,
    })
    .from(notificationPrefs)
    .leftJoin(
      meals,
      and(
        eq(meals.userId, notificationPrefs.userId),
        gte(meals.loggedAt, lastWeekStart),
        lt(meals.loggedAt, weekStart),
      ),
    )
    .where(and(eq(notificationPrefs.weeklyRecap, true), isNotNull(notificationPrefs.expoPushToken)))
    .groupBy(notificationPrefs.userId, notificationPrefs.expoPushToken)

  const messages: Message[] = []
  for (const r of rows) {
    if (!r.token) continue
    const totalCalories = Number(r.totalCalories)
    const count = Number(r.mealCount)
    const avg = count > 0 ? Math.round(totalCalories / 7) : 0
    messages.push({
      token: r.token,
      title: 'Rekap minggu lalu',
      body: `${count} makanan tercatat, rata-rata ${formatKcal(avg)} per hari. Cek detail di app.`,
    })
  }
  if (messages.length > 0) {
    logger.info({ count: messages.length }, 'kirim weekly recap')
    await sendBatch(messages)
  }
}

const tasks: ScheduledTask[] = []

export function registerCrons(db: Database): void {
  tasks.forEach((t) => t.stop())
  tasks.length = 0

  tasks.push(
    cron.schedule(
      '0 20 * * *',
      () => {
        runMealReminder(db).catch((err) => logger.error({ err }, 'meal reminder failed'))
      },
      { timezone: TZ },
    ),
  )
  tasks.push(
    cron.schedule(
      '0 8 * * 1',
      () => {
        runWeeklyRecap(db).catch((err) => logger.error({ err }, 'weekly recap failed'))
      },
      { timezone: TZ },
    ),
  )

  logger.info({ jobs: tasks.length }, 'cron jobs registered')
}

export async function triggerMealReminderNow(db: Database): Promise<void> {
  await runMealReminder(db)
}

export async function triggerWeeklyRecapNow(db: Database): Promise<void> {
  await runWeeklyRecap(db)
}
