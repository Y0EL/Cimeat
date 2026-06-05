import { z } from 'zod'

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  REVENUECAT_API_KEY_IOS: z.string().optional(),
  REVENUECAT_API_KEY_ANDROID: z.string().optional(),
  REVENUECAT_WEBHOOK_AUTH: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_PUBLIC_URL: z.string().url().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  TTS_PROVIDER: z.enum(['gemini', 'elevenlabs', 'openai', 'google', 'none']).default('none'),
  TTS_API_KEY: z.string().optional(),
  TTS_VOICE_ID: z.string().optional(),
  TTS_VOICE_MALE: z.string().default('Algenib'),
  TTS_VOICE_FEMALE: z.string().default('Leda'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_BASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

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

export const foodLogSourceSchema = z.enum([
  'vision',
  'audio',
  'text',
  'manual',
  'nearby',
  'recipe',
  'telegram',
  'whatsapp',
])
export type FoodLogSource = z.infer<typeof foodLogSourceSchema>

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

export const planSchema = z.enum(['free', 'pro', 'max'])
export type Plan = z.infer<typeof planSchema>

export const cimitToneSchema = z.enum(['soft', 'normal', 'savage'])
export type CimitTone = z.infer<typeof cimitToneSchema>

export const eatingModeSchema = z.enum(['hemat', 'sehat', 'balanced'])
export type EatingMode = z.infer<typeof eatingModeSchema>

export const usageFeatureSchema = z.enum([
  'vision',
  'audio',
  'text',
  'recipe',
  'nearby',
  'cimit_advice',
  'tts',
])
export type UsageFeature = z.infer<typeof usageFeatureSchema>

export const subscriptionEntitlementSchema = z.enum(['cimeat_pro', 'cimeat_max'])
export const cimitMessageTypeSchema = z.enum(['advice', 'roast', 'chat', 'recipe_comment'])

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

export const macronutrientsSchema = z.object({
  protein_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
})
export type Macronutrients = z.infer<typeof macronutrientsSchema>

export const createFoodLogSchema = z.object({
  source: foodLogSourceSchema.default('manual'),
  mealType: mealTypeSchema.optional(),
  foodId: z.string().uuid().optional(),
  foodName: z.string().min(1).max(160),
  estimatedWeightG: z.number().int().positive().optional(),
  calories: z.number().int().nonnegative(),
  proteinG: z.number().nonnegative().default(0),
  carbsG: z.number().nonnegative().default(0),
  fatG: z.number().nonnegative().default(0),
  healthScore: z.number().int().min(0).max(100).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  imageUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional(),
  note: z.string().max(500).optional(),
  rawAiResult: z.unknown().optional(),
  eatenAt: z.string().datetime(),
})
export type CreateFoodLogInput = z.infer<typeof createFoodLogSchema>

export const updateFoodLogSchema = z.object({
  mealType: mealTypeSchema.optional(),
  foodName: z.string().min(1).max(160).optional(),
  estimatedWeightG: z.number().int().positive().optional(),
  calories: z.number().int().nonnegative().optional(),
  proteinG: z.number().nonnegative().optional(),
  carbsG: z.number().nonnegative().optional(),
  fatG: z.number().nonnegative().optional(),
  note: z.string().max(500).optional(),
  eatenAt: z.string().datetime().optional(),
})
export type UpdateFoodLogInput = z.infer<typeof updateFoodLogSchema>

export const bulkDeleteFoodLogsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
})
export type BulkDeleteFoodLogsInput = z.infer<typeof bulkDeleteFoodLogsSchema>

export const foodLogSchema = z.object({
  id: z.string().uuid(),
  foodId: z.string().uuid().nullable(),
  source: foodLogSourceSchema,
  mealType: mealTypeSchema.nullable(),
  foodName: z.string(),
  estimatedWeightG: z.number().nullable(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  healthScore: z.number().nullable(),
  confidenceScore: z.number().nullable(),
  imageUrl: z.string().nullable(),
  audioUrl: z.string().nullable(),
  note: z.string().nullable(),
  eatenAt: z.string(),
})
export type FoodLogDto = z.infer<typeof foodLogSchema>

export const listFoodLogsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  mealType: mealTypeSchema.optional(),
  q: z.string().max(120).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})
export type ListFoodLogsQuery = z.infer<typeof listFoodLogsQuerySchema>

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
  cimitTone: cimitToneSchema.optional(),
  defaultMode: eatingModeSchema.optional(),
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
  activePlan: planSchema,
  cimitTone: cimitToneSchema,
  defaultMode: eatingModeSchema,
})
export type UserProfile = z.infer<typeof userProfileSchema>

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
  offsideAmount: z.number(),
  byMealType: z.array(z.object({ mealType: mealTypeSchema, calories: z.number() })),
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

export const calorieRangeSchema = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
})

export const foodAnalysisSchema = z.object({
  food_name: z.string(),
  estimated_weight_g: z.number().int().nonnegative(),
  calories: z.number().int().nonnegative(),
  macronutrients: macronutrientsSchema,
  health_score: z.number().int().min(0).max(100),
  confidence_score: z.number().min(0).max(1),
  calorie_range: calorieRangeSchema,
  portion_notes: z.string().optional(),
  cimit_message: z.string(),
})
export type FoodAnalysis = z.infer<typeof foodAnalysisSchema>

export const analyzeImageResponseSchema = foodAnalysisSchema.extend({
  draft_id: z.string().uuid().optional(),
})
export type AnalyzeImageResponse = z.infer<typeof analyzeImageResponseSchema>

export const analyzeAudioResponseSchema = foodAnalysisSchema.extend({
  transcript: z.string(),
  draft_id: z.string().uuid().optional(),
})
export type AnalyzeAudioResponse = z.infer<typeof analyzeAudioResponseSchema>

export const analyzeImageRequestSchema = z.object({
  image: z.string().min(1),
  mimeType: z.string().default('image/jpeg'),
  mealType: mealTypeSchema.optional(),
  saveMode: z.enum(['draft', 'save']).default('draft'),
})
export type AnalyzeImageRequest = z.infer<typeof analyzeImageRequestSchema>

export const analyzeAudioRequestSchema = z.object({
  audio: z.string().min(1),
  mimeType: z.string().default('audio/m4a'),
  saveMode: z.enum(['draft', 'save']).default('draft'),
})
export type AnalyzeAudioRequest = z.infer<typeof analyzeAudioRequestSchema>

export const analyzeTextRequestSchema = z.object({
  text: z.string().min(1).max(500),
  mealType: mealTypeSchema.optional(),
  saveMode: z.enum(['draft', 'save']).default('draft'),
})
export type AnalyzeTextRequest = z.infer<typeof analyzeTextRequestSchema>

export const recipeGenerateSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1).max(40),
  mode: eatingModeSchema.default('balanced'),
  remaining_calories: z.number().int().optional(),
  remaining_protein_g: z.number().optional(),
  budget: z.number().int().positive().optional(),
  tools: z.array(z.string()).optional(),
  avoid: z.array(z.string()).optional(),
})
export type RecipeGenerateInput = z.infer<typeof recipeGenerateSchema>

export const recipeResponseSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  mode: eatingModeSchema,
  recipe_markdown: z.string(),
  nutrition_estimate: z.object({
    calories: z.number().int().nonnegative(),
    protein_g: z.number().nonnegative(),
    carbs_g: z.number().nonnegative(),
    fat_g: z.number().nonnegative(),
    servings: z.number().positive(),
  }),
  cimit_message: z.string().optional(),
})
export type RecipeResponse = z.infer<typeof recipeResponseSchema>

export const nearbyRecommendSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  mode: eatingModeSchema.default('balanced'),
  radius_m: z.number().int().positive().max(5000).default(1000),
})
export type NearbyRecommendInput = z.infer<typeof nearbyRecommendSchema>

export const nearbyItemSchema = z.object({
  name: z.string(),
  distance_m: z.number().int().nonnegative(),
  food_type: z.string(),
  suggested_order: z.string(),
  estimated_calories: z.number().int().nonnegative(),
  reason: z.string(),
})
export type NearbyItem = z.infer<typeof nearbyItemSchema>

export const nearbyResponseSchema = z.object({
  mode: eatingModeSchema,
  items: z.array(nearbyItemSchema),
  cimit_message: z.string(),
})
export type NearbyResponse = z.infer<typeof nearbyResponseSchema>

export const cimitChatSchema = z.object({
  message: z.string().min(1).max(2000),
})
export type CimitChatInput = z.infer<typeof cimitChatSchema>

export const cimitAdviceSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})
export type CimitAdviceInput = z.infer<typeof cimitAdviceSchema>

export const cimitMessageSchema = z.object({
  id: z.string().uuid(),
  type: cimitMessageTypeSchema,
  role: z.enum(['user', 'model']),
  content: z.string(),
  tone: cimitToneSchema.nullable(),
  audioUrl: z.string().nullable(),
  createdAt: z.string(),
})
export type CimitMessageDto = z.infer<typeof cimitMessageSchema>

export const cimitHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.string().datetime().optional(),
})

export const cimitVoiceSchema = z.enum(['male', 'female'])
export type CimitVoice = z.infer<typeof cimitVoiceSchema>

export const cimitTtsSchema = z.object({
  text: z.string().min(1).max(800),
  tone: cimitToneSchema.optional(),
  voice: cimitVoiceSchema.default('female'),
})
export type CimitTtsInput = z.infer<typeof cimitTtsSchema>

export const cimitTtsResponseSchema = z.object({
  audioUrl: z.string().url(),
  text: z.string(),
})
export type CimitTtsResponse = z.infer<typeof cimitTtsResponseSchema>

export const usageFeatureLimitSchema = z.object({
  feature: usageFeatureSchema,
  used: z.number().int().nonnegative(),
  limit: z.number().int(),
  remaining: z.number().int(),
})
export type UsageFeatureLimit = z.infer<typeof usageFeatureLimitSchema>

export const usageTodaySchema = z.object({
  plan: planSchema,
  date: z.string(),
  features: z.array(usageFeatureLimitSchema),
})
export type UsageToday = z.infer<typeof usageTodaySchema>

export const subscriptionStatusSchema = z.object({
  plan: planSchema,
  entitlements: z.array(subscriptionEntitlementSchema),
  expiresAt: z.string().nullable(),
})
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>

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

export const QUOTA_LIMITS: Record<Plan, Record<UsageFeature, number>> = {
  free: {
    vision: 5,
    audio: 15,
    text: 20,
    recipe: 2,
    nearby: 3,
    cimit_advice: 3,
    tts: 3,
  },
  pro: {
    vision: 30,
    audio: 100,
    text: 200,
    recipe: 20,
    nearby: 30,
    cimit_advice: 30,
    tts: 30,
  },
  max: {
    vision: 100,
    audio: 300,
    text: -1,
    recipe: 100,
    nearby: -1,
    cimit_advice: -1,
    tts: -1,
  },
}
