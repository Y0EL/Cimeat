import {
  Apple,
  Beef,
  Coffee,
  Cookie,
  Milk,
  Pizza,
  Salad,
  Utensils,
  Wheat,
  type LucideIcon,
} from 'lucide-react-native'
import type { FoodCategory } from '@cimeat/types'

export type CategoryKey = FoodCategory

export type CategoryMeta = {
  key: CategoryKey
  label: string
  icon: LucideIcon
  tint: string
  soft: string
}

const other: CategoryMeta = {
  key: 'other',
  label: 'Lainnya',
  icon: Utensils,
  tint: '#71717a',
  soft: 'rgba(113,113,122,0.12)',
}

export const categoryList: CategoryMeta[] = [
  { key: 'protein', label: 'Protein', icon: Beef, tint: '#f43f5e', soft: 'rgba(244,63,94,0.12)' },
  {
    key: 'vegetable',
    label: 'Sayur',
    icon: Salad,
    tint: '#22c55e',
    soft: 'rgba(34,197,94,0.12)',
  },
  { key: 'fruit', label: 'Buah', icon: Apple, tint: '#ec4899', soft: 'rgba(236,72,153,0.12)' },
  {
    key: 'grain',
    label: 'Karbo',
    icon: Wheat,
    tint: '#f59e0b',
    soft: 'rgba(245,158,11,0.12)',
  },
  { key: 'dairy', label: 'Dairy', icon: Milk, tint: '#0ea5e9', soft: 'rgba(14,165,233,0.12)' },
  {
    key: 'fastfood',
    label: 'Cepat saji',
    icon: Pizza,
    tint: '#ef4444',
    soft: 'rgba(239,68,68,0.12)',
  },
  {
    key: 'beverage',
    label: 'Minuman',
    icon: Coffee,
    tint: '#8b5cf6',
    soft: 'rgba(139,92,246,0.12)',
  },
  {
    key: 'snack',
    label: 'Camilan',
    icon: Cookie,
    tint: '#f97316',
    soft: 'rgba(249,115,22,0.12)',
  },
  other,
]

export function getCategoryMeta(key: CategoryKey): CategoryMeta {
  return categoryList.find((c) => c.key === key) ?? other
}

export const MACRO_COLORS = {
  calories: '#FF6B35',
  protein: '#f43f5e',
  carb: '#f59e0b',
  fat: '#0ea5e9',
} as const
