import { z } from 'zod'

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL_VISION: z.string().default('gemini-2.5-flash'),
  GEMINI_MODEL_CHAT: z.string().default('gemini-2.5-flash'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(8),
  TELEGRAM_BOT_USERNAME: z.string().default('cimeatbot'),
  REVENUECAT_API_KEY_IOS: z.string().optional(),
  REVENUECAT_API_KEY_ANDROID: z.string().optional(),
  REVENUECAT_WEBHOOK_AUTH: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_BASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
export type MealType = z.infer<typeof mealTypeSchema>

export const foodCategorySchema = z.enum([
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
export type FoodCategory = z.infer<typeof foodCategorySchema>

export const mealSourceSchema = z.enum([
  'mobile',
  'telegram',
  'whatsapp',
  'photo',
  'chat',
  'manual',
  'recipe',
])
export const confidenceSchema = z.enum(['high', 'medium', 'low'])
export const channelSchema = z.enum(['telegram', 'whatsapp'])
export const sexSchema = z.enum(['male', 'female'])
export const activityLevelSchema = z.enum([
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
])
export type ActivityLevel = z.infer<typeof activityLevelSchema>
export const goalTypeSchema = z.enum(['lose', 'maintain', 'gain'])
export type GoalType = z.infer<typeof goalTypeSchema>

// ---------------------------------------------------------------------------
// Foods
// ---------------------------------------------------------------------------
const macroFields = {
  calories: z.number().int().nonnegative(),
  protein: z.number().nonnegative().default(0),
  carb: z.number().nonnegative().default(0),
  fat: z.number().nonnegative().default(0),
}

export const createFoodSchema = z.object({
  name: z.string().min(1).max(80),
  category: foodCategorySchema.default('other'),
  servingLabel: z.string().min(1).max(40).default('1 porsi'),
  icon: z.string().optional(),
  ...macroFields,
})

export type CreateFoodInput = z.infer<typeof createFoodSchema>

export const updateFoodSchema = createFoodSchema.partial().extend({
  isFavorite: z.boolean().optional(),
})

export type UpdateFoodInput = z.infer<typeof updateFoodSchema>

export const foodSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: foodCategorySchema,
  servingLabel: z.string(),
  calories: z.number(),
  protein: z.number(),
  carb: z.number(),
  fat: z.number(),
  icon: z.string().nullable(),
  isPreset: z.boolean(),
  isFavorite: z.boolean(),
})

export type FoodDto = z.infer<typeof foodSchema>

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------
export const createMealSchema = z.object({
  foodId: z.string().uuid().optional(),
  mealType: mealTypeSchema,
  name: z.string().min(1).max(120),
  servings: z.number().positive().default(1),
  note: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
  loggedAt: z.string().datetime(),
  source: mealSourceSchema.default('mobile'),
  ...macroFields,
})

export type CreateMealInput = z.infer<typeof createMealSchema>

export const updateMealSchema = z.object({
  mealType: mealTypeSchema.optional(),
  name: z.string().min(1).max(120).optional(),
  servings: z.number().positive().optional(),
  note: z.string().max(500).optional(),
  loggedAt: z.string().datetime().optional(),
  calories: z.number().int().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carb: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
})

export type UpdateMealInput = z.infer<typeof updateMealSchema>

export const bulkDeleteMealsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
})

export type BulkDeleteMealsInput = z.infer<typeof bulkDeleteMealsSchema>

export const mealSchema = z.object({
  id: z.string().uuid(),
  foodId: z.string().uuid().nullable(),
  mealType: mealTypeSchema,
  name: z.string(),
  servings: z.number(),
  calories: z.number(),
  protein: z.number(),
  carb: z.number(),
  fat: z.number(),
  note: z.string().nullable(),
  photoUrl: z.string().nullable(),
  loggedAt: z.string(),
  source: mealSourceSchema,
})

export type MealDto = z.infer<typeof mealSchema>

export const listMealsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  mealType: mealTypeSchema.optional(),
  q: z.string().max(120).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListMealsQuery = z.infer<typeof listMealsQuerySchema>

// ---------------------------------------------------------------------------
// Nutrition goals & profile
// ---------------------------------------------------------------------------
export const upsertNutritionGoalSchema = z.object({
  calorieGoal: z.number().int().positive(),
  proteinGoal: z.number().nonnegative().default(0),
  carbGoal: z.number().nonnegative().default(0),
  fatGoal: z.number().nonnegative().default(0),
  goalType: goalTypeSchema.default('maintain'),
})

export type UpsertNutritionGoalInput = z.infer<typeof upsertNutritionGoalSchema>

export const nutritionGoalSchema = z.object({
  calorieGoal: z.number().int().nonnegative(),
  proteinGoal: z.number().nonnegative(),
  carbGoal: z.number().nonnegative(),
  fatGoal: z.number().nonnegative(),
  goalType: goalTypeSchema,
})

export type NutritionGoalDto = z.infer<typeof nutritionGoalSchema>

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  sex: sexSchema.optional(),
  birthYear: z.number().int().min(1900).max(2025).optional(),
  heightCm: z.number().positive().max(300).optional(),
  weightKg: z.number().positive().max(500).optional(),
  activityLevel: activityLevelSchema.optional(),
  goalType: goalTypeSchema.optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  locale: z.string(),
  sex: sexSchema.nullable(),
  birthYear: z.number().nullable(),
  heightCm: z.number().nullable(),
  weightKg: z.number().nullable(),
  activityLevel: activityLevelSchema.nullable(),
  goalType: goalTypeSchema.nullable(),
  isSubscribed: z.boolean(),
})

export type UserProfile = z.infer<typeof userProfileSchema>

// ---------------------------------------------------------------------------
// Summary & trends
// ---------------------------------------------------------------------------
export const macroTotalsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carb: z.number(),
  fat: z.number(),
})

export type MacroTotals = z.infer<typeof macroTotalsSchema>

export const daySummaryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type DaySummaryQuery = z.infer<typeof daySummaryQuerySchema>

export const dailySummarySchema = z.object({
  date: z.string(),
  goal: nutritionGoalSchema,
  consumed: macroTotalsSchema,
  remaining: macroTotalsSchema,
  byMealType: z.array(
    z.object({
      mealType: mealTypeSchema,
      calories: z.number(),
    }),
  ),
})

export type DailySummary = z.infer<typeof dailySummarySchema>

export const flexTrendItemSchema = z.object({
  label: z.string(),
  calories: z.number(),
  protein: z.number(),
  carb: z.number(),
  fat: z.number(),
})

export type FlexTrendItem = z.infer<typeof flexTrendItemSchema>

export const flexTrendQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export type FlexTrendQuery = z.infer<typeof flexTrendQuerySchema>

// ---------------------------------------------------------------------------
// AI Diet Coach (chat-only)
// ---------------------------------------------------------------------------
export const coachChatSchema = z.object({
  message: z.string().min(1).max(2000),
})

export type CoachChatInput = z.infer<typeof coachChatSchema>

export const coachMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'model']),
  content: z.string(),
  createdAt: z.string(),
})

export type CoachMessageDto = z.infer<typeof coachMessageSchema>

export const coachHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.string().datetime().optional(),
})

// ---------------------------------------------------------------------------
// Food photo scan (AI vision)
// ---------------------------------------------------------------------------
export const foodScanItemSchema = z.object({
  name: z.string(),
  category: foodCategorySchema,
  servingLabel: z.string(),
  calories: z.number().int().nonnegative(),
  protein: z.number().nonnegative(),
  carb: z.number().nonnegative(),
  fat: z.number().nonnegative(),
})

export type FoodScanItem = z.infer<typeof foodScanItemSchema>

export const foodScanResponseSchema = z.object({
  items: z.array(foodScanItemSchema),
  totalCalories: z.number().int().nonnegative(),
  confidence: confidenceSchema,
})

export type FoodScanResponse = z.infer<typeof foodScanResponseSchema>

export const foodScanRequestSchema = z.object({
  image: z.string().min(1),
  mimeType: z.string().default('image/jpeg'),
})

export type FoodScanRequest = z.infer<typeof foodScanRequestSchema>

// ---------------------------------------------------------------------------
// Recipe calorie builder
// ---------------------------------------------------------------------------
export const recipeChatSchema = z.object({
  message: z.string().min(1).max(2000),
})

export type RecipeChatInput = z.infer<typeof recipeChatSchema>

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const registerPushTokenSchema = z.object({
  token: z.string().min(1).max(200),
})

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>

export const updateNotifPrefsSchema = z.object({
  mealReminder: z.boolean().optional(),
  weeklyRecap: z.boolean().optional(),
  goalAlerts: z.boolean().optional(),
})

export type UpdateNotifPrefsInput = z.infer<typeof updateNotifPrefsSchema>

export const notifPrefsSchema = z.object({
  mealReminder: z.boolean(),
  weeklyRecap: z.boolean(),
  goalAlerts: z.boolean(),
  hasPushToken: z.boolean(),
})

export type NotifPrefs = z.infer<typeof notifPrefsSchema>

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------
export const validFoodCategories = [
  'protein',
  'vegetable',
  'fruit',
  'grain',
  'dairy',
  'fastfood',
  'beverage',
  'snack',
  'other',
] as const

export type ValidFoodCategory = (typeof validFoodCategories)[number]
