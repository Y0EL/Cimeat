import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const channelEnum = pgEnum('channel', ['telegram', 'whatsapp'])
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack'])
export const foodCategoryEnum = pgEnum('food_category', [
  'protein',
  'vegetable',
  'fruit',
  'grain',
  'dairy',
  'fastfood',
  'beverage',
  'snack',
  'other',
])
export const mealSourceEnum = pgEnum('meal_source', [
  'mobile',
  'telegram',
  'whatsapp',
  'photo',
  'chat',
  'manual',
  'recipe',
])
export const confidenceEnum = pgEnum('confidence', ['high', 'medium', 'low'])
export const sexEnum = pgEnum('sex', ['male', 'female'])
export const activityLevelEnum = pgEnum('activity_level', [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
])
export const goalTypeEnum = pgEnum('goal_type', ['lose', 'maintain', 'gain'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').unique(),
  name: text('name'),
  phone: text('phone'),
  locale: text('locale').notNull().default('id-ID'),
  // Body profile (for TDEE calculation)
  sex: sexEnum('sex'),
  birthYear: integer('birth_year'),
  heightCm: real('height_cm'),
  weightKg: real('weight_kg'),
  activityLevel: activityLevelEnum('activity_level').default('moderate'),
  goalType: goalTypeEnum('goal_type').default('maintain'),
  isSubscribed: boolean('is_subscribed').notNull().default(false),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const channelLinks = pgTable(
  'channel_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: channelEnum('channel').notNull(),
    externalId: text('external_id').notNull(),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    channelExternalUnique: uniqueIndex('channel_links_channel_external_uq').on(
      t.channel,
      t.externalId,
    ),
  }),
)

export const linkingCodes = pgTable('linking_codes', {
  code: text('code').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
})

// Food database: preset library + user custom foods. Macros per single serving.
export const foods = pgTable(
  'foods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: foodCategoryEnum('category').notNull().default('other'),
    servingLabel: text('serving_label').notNull().default('1 porsi'),
    calories: integer('calories').notNull(),
    protein: real('protein').notNull().default(0),
    carb: real('carb').notNull().default(0),
    fat: real('fat').notNull().default(0),
    icon: text('icon'),
    isPreset: boolean('is_preset').notNull().default(false),
    isFavorite: boolean('is_favorite').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userNameIdx: index('foods_user_name_idx').on(t.userId, t.name),
  }),
)

// Logged meals. Macros are the final values for the entry (food macros * servings).
export const meals = pgTable(
  'meals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id').references(() => foods.id),
    mealType: mealTypeEnum('meal_type').notNull(),
    name: text('name').notNull(),
    servings: real('servings').notNull().default(1),
    calories: integer('calories').notNull(),
    protein: real('protein').notNull().default(0),
    carb: real('carb').notNull().default(0),
    fat: real('fat').notNull().default(0),
    note: text('note'),
    photoUrl: text('photo_url'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull(),
    source: mealSourceEnum('source').notNull().default('mobile'),
    photoConfidence: confidenceEnum('photo_confidence'),
    rawPayload: jsonb('raw_payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userLoggedIdx: index('meals_user_logged_idx').on(t.userId, t.loggedAt),
    userMealTypeIdx: index('meals_user_meal_type_idx').on(t.userId, t.mealType),
  }),
)

// Daily nutrition targets. One active row per user (latest by startsAt wins).
export const nutritionGoals = pgTable('nutrition_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  calorieGoal: integer('calorie_goal').notNull(),
  proteinGoal: real('protein_goal').notNull().default(0),
  carbGoal: real('carb_goal').notNull().default(0),
  fatGoal: real('fat_goal').notNull().default(0),
  goalType: goalTypeEnum('goal_type').notNull().default('maintain'),
  startsAt: date('starts_at').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// AI Diet Coach chat history (chat-only, no voice sessions).
export const coachMessages = pgTable(
  'coach_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('coach_messages_user_created_idx').on(t.userId, t.createdAt),
  }),
)

export const whatsappSessions = pgTable('whatsapp_sessions', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  jid: text('jid'),
  creds: jsonb('creds'),
  keys: jsonb('keys').notNull().default({}),
  linkedAt: timestamp('linked_at', { withTimezone: true }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
})

export const notificationPrefs = pgTable('notification_prefs', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  mealReminder: boolean('meal_reminder').notNull().default(true),
  reminderTime: time('reminder_time').notNull().default('20:00'),
  goalAlerts: boolean('goal_alerts').notNull().default(true),
  weeklyRecap: boolean('weekly_recap').notNull().default(true),
  expoPushToken: text('expo_push_token'),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Food = typeof foods.$inferSelect
export type NewFood = typeof foods.$inferInsert
export type Meal = typeof meals.$inferSelect
export type NewMeal = typeof meals.$inferInsert
export type NutritionGoal = typeof nutritionGoals.$inferSelect
export type NewNutritionGoal = typeof nutritionGoals.$inferInsert
export type ChannelLink = typeof channelLinks.$inferSelect
export type WhatsappSession = typeof whatsappSessions.$inferSelect
export type NewWhatsappSession = typeof whatsappSessions.$inferInsert
export type CoachMessage = typeof coachMessages.$inferSelect
export type NewCoachMessage = typeof coachMessages.$inferInsert
