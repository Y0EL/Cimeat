import type { MealType, ValidFoodCategory } from '@cimeat/types'

export type ParsedFoodEntry = {
  name: string
  calories: number | null
  category: ValidFoodCategory
  mealType: MealType | null
  confidence: 'high' | 'medium' | 'low'
}

// Matches a calorie figure like "600 kkal", "250kal", "1.2k kkal", "300 cal".
// The optional "k" thousand-multiplier must be a standalone token (followed by
// whitespace) so it is not confused with the leading "k" of "kkal".
const caloriePattern = /(\d+(?:[.,]\d+)?)\s*(?:(k)\s+)?(?:kkal|kcal|kalori|kal|cal)\b/i

// Order matters: more specific drinks (beverage) are checked before dairy so
// "kopi susu" resolves to beverage rather than matching the "susu" dairy keyword.
const categoryKeywords: Record<ValidFoodCategory, string[]> = {
  protein: ['ayam', 'telur', 'daging', 'sapi', 'ikan', 'tahu', 'tempe', 'udang', 'tuna', 'sosis'],
  vegetable: ['sayur', 'bayam', 'kangkung', 'brokoli', 'salad', 'capcay', 'terong', 'wortel'],
  fruit: ['buah', 'apel', 'pisang', 'jeruk', 'mangga', 'semangka', 'anggur', 'pepaya', 'melon'],
  grain: ['nasi', 'mie', 'roti', 'pasta', 'kentang', 'oat', 'sereal', 'bihun', 'kwetiau', 'bubur'],
  fastfood: ['burger', 'pizza', 'kentang goreng', 'fried chicken', 'kfc', 'mcd', 'hotdog', 'kebab'],
  beverage: ['kopi', 'teh', 'jus', 'boba', 'soda', 'cola', 'es', 'minum', 'smoothie', 'milkshake'],
  dairy: ['susu', 'keju', 'yogurt', 'yoghurt', 'mentega'],
  snack: ['keripik', 'biskuit', 'coklat', 'permen', 'donat', 'kue', 'cokelat', 'wafer', 'gorengan'],
  other: [],
}

const mealTypeKeywords: Record<MealType, string[]> = {
  breakfast: ['sarapan', 'breakfast', 'pagi'],
  lunch: ['makan siang', 'lunch', 'siang'],
  dinner: ['makan malam', 'dinner', 'malam'],
  snack: ['ngemil', 'cemilan', 'camilan', 'snack', 'selingan'],
}

export function parseCaloriesFromText(text: string): number | null {
  const match = text.match(caloriePattern)
  if (!match) return null
  const base = parseFloat(match[1]!.replace(',', '.'))
  if (!Number.isFinite(base)) return null
  const thousand = match[2]?.toLowerCase() === 'k'
  return Math.round(thousand ? base * 1000 : base)
}

export function detectFoodCategory(text: string): ValidFoodCategory {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(categoryKeywords) as [
    ValidFoodCategory,
    string[],
  ][]) {
    if (keywords.some((kw) => lower.includes(kw))) return category
  }
  return 'other'
}

export function detectMealType(text: string): MealType | null {
  const lower = text.toLowerCase()
  for (const [mealType, keywords] of Object.entries(mealTypeKeywords) as [MealType, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return mealType
  }
  return null
}

export function parseQuickAddText(text: string): ParsedFoodEntry | null {
  const trimmed = text.trim()
  if (trimmed.length === 0) return null

  const calories = parseCaloriesFromText(trimmed)
  const category = detectFoodCategory(trimmed)
  const mealType = detectMealType(trimmed)

  let name = trimmed.replace(caloriePattern, '')
  for (const keywords of Object.values(mealTypeKeywords)) {
    for (const kw of keywords) {
      name = name.replace(new RegExp(`\\b${kw}\\b`, 'ig'), '')
    }
  }
  name = name.replace(/\s+/g, ' ').trim()
  if (name.length === 0) return null

  const confidence: ParsedFoodEntry['confidence'] =
    calories !== null ? 'high' : category !== 'other' ? 'medium' : 'low'

  return { name, calories, category, mealType, confidence }
}
