import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

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
export const foodLogSourceEnum = pgEnum('food_log_source', [
  'vision',
  'audio',
  'text',
  'manual',
  'nearby',
  'recipe',
  'telegram',
  'whatsapp',
])
export const sexEnum = pgEnum('sex', ['male', 'female'])
export const activityLevelEnum = pgEnum('activity_level', [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
])
export const goalTypeEnum = pgEnum('goal_type', ['lose', 'maintain', 'gain'])
export const planEnum = pgEnum('plan', ['free', 'pro', 'max'])
export const cimitToneEnum = pgEnum('cimit_tone', ['soft', 'normal', 'savage'])
export const eatingModeEnum = pgEnum('eating_mode', ['hemat', 'sehat', 'balanced'])
export const usageFeatureEnum = pgEnum('usage_feature', [
  'vision',
  'audio',
  'text',
  'recipe',
  'nearby',
  'cimit_advice',
  'tts',
])
export const subscriptionEntitlementEnum = pgEnum('subscription_entitlement', [
  'cimeat_pro',
  'cimeat_max',
])
export const cimitMessageTypeEnum = pgEnum('cimit_message_type', [
  'advice',
  'roast',
  'chat',
  'recipe_comment',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').unique(),
  name: text('name'),
  phone: text('phone'),
  locale: text('locale').notNull().default('id-ID'),
  sex: sexEnum('sex'),
  birthYear: integer('birth_year'),
  heightCm: real('height_cm'),
  weightKg: real('weight_kg'),
  activityLevel: activityLevelEnum('activity_level').default('moderate'),
  goalType: goalTypeEnum('goal_type').default('maintain'),
  activePlan: planEnum('active_plan').notNull().default('free'),
  cimitTone: cimitToneEnum('cimit_tone').notNull().default('normal'),
  defaultMode: eatingModeEnum('default_mode').notNull().default('balanced'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

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

export const foodLogs = pgTable(
  'food_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id').references(() => foods.id),
    source: foodLogSourceEnum('source').notNull().default('manual'),
    mealType: mealTypeEnum('meal_type'),
    foodName: text('food_name').notNull(),
    estimatedWeightG: integer('estimated_weight_g'),
    calories: integer('calories').notNull(),
    proteinG: real('protein_g').notNull().default(0),
    carbsG: real('carbs_g').notNull().default(0),
    fatG: real('fat_g').notNull().default(0),
    healthScore: integer('health_score'),
    confidenceScore: real('confidence_score'),
    imageUrl: text('image_url'),
    audioUrl: text('audio_url'),
    note: text('note'),
    rawAiResult: jsonb('raw_ai_result'),
    eatenAt: timestamp('eaten_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userEatenIdx: index('food_logs_user_eaten_idx').on(t.userId, t.eatenAt),
    userMealTypeIdx: index('food_logs_user_meal_type_idx').on(t.userId, t.mealType),
  }),
)

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

export const recipes = pgTable(
  'recipes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    mode: eatingModeEnum('mode').notNull().default('balanced'),
    ingredients: jsonb('ingredients'),
    recipeMarkdown: text('recipe_markdown').notNull(),
    nutritionEstimate: jsonb('nutrition_estimate'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('recipes_user_created_idx').on(t.userId, t.createdAt),
  }),
)

export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    feature: usageFeatureEnum('feature').notNull(),
    planSnapshot: planEnum('plan_snapshot').notNull().default('free'),
    usageDate: date('usage_date').notNull(),
    count: integer('count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userFeatureDateUq: uniqueIndex('usage_events_user_feature_date_uq').on(
      t.userId,
      t.feature,
      t.usageDate,
    ),
  }),
)

export const dailySummaries = pgTable(
  'daily_summaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    summaryDate: date('summary_date').notNull(),
    totalCalories: integer('total_calories').notNull().default(0),
    totalProteinG: real('total_protein_g').notNull().default(0),
    totalCarbsG: real('total_carbs_g').notNull().default(0),
    totalFatG: real('total_fat_g').notNull().default(0),
    offsideAmount: integer('offside_amount').notNull().default(0),
    cimitSummary: jsonb('cimit_summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userDateUq: uniqueIndex('daily_summaries_user_date_uq').on(t.userId, t.summaryDate),
  }),
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('revenuecat'),
    entitlement: subscriptionEntitlementEnum('entitlement').notNull(),
    status: text('status').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    rawPayload: jsonb('raw_payload'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userEntitlementUq: uniqueIndex('subscriptions_user_entitlement_uq').on(
      t.userId,
      t.entitlement,
    ),
  }),
)

export const cimitMessages = pgTable(
  'cimit_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: cimitMessageTypeEnum('type').notNull().default('chat'),
    role: text('role').notNull().default('model'),
    content: text('content').notNull(),
    tone: cimitToneEnum('tone'),
    audioUrl: text('audio_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('cimit_messages_user_created_idx').on(t.userId, t.createdAt),
  }),
)

export const savedLocations = pgTable('saved_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const mealPreferences = pgTable('meal_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  avoid: jsonb('avoid'),
  dietType: text('diet_type'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pantryItems = pgTable(
  'pantry_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userNameIdx: index('pantry_items_user_name_idx').on(t.userId, t.name),
  }),
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Food = typeof foods.$inferSelect
export type NewFood = typeof foods.$inferInsert
export type FoodLog = typeof foodLogs.$inferSelect
export type NewFoodLog = typeof foodLogs.$inferInsert
export type NutritionGoal = typeof nutritionGoals.$inferSelect
export type NewNutritionGoal = typeof nutritionGoals.$inferInsert
export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert
export type UsageEvent = typeof usageEvents.$inferSelect
export type NewUsageEvent = typeof usageEvents.$inferInsert
export type DailySummary = typeof dailySummaries.$inferSelect
export type NewDailySummary = typeof dailySummaries.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type CimitMessage = typeof cimitMessages.$inferSelect
export type NewCimitMessage = typeof cimitMessages.$inferInsert
export type SavedLocation = typeof savedLocations.$inferSelect
export type PantryItem = typeof pantryItems.$inferSelect
