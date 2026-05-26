import type { ValidFoodCategory } from '@cimeat/types'

export type PresetFood = {
  name: string
  category: ValidFoodCategory
  servingLabel: string
  calories: number
  protein: number
  carb: number
  fat: number
  icon: string
}

// ~20 common Indonesian foods with realistic per-serving macros.
export const PRESET_FOODS: PresetFood[] = [
  { name: 'Nasi Putih', category: 'grain', servingLabel: '1 centong', calories: 200, protein: 4, carb: 44, fat: 0.4, icon: 'Wheat' },
  { name: 'Nasi Goreng', category: 'grain', servingLabel: '1 piring', calories: 600, protein: 15, carb: 80, fat: 22, icon: 'Wheat' },
  { name: 'Ayam Goreng', category: 'protein', servingLabel: '1 potong', calories: 260, protein: 26, carb: 8, fat: 14, icon: 'Drumstick' },
  { name: 'Telur', category: 'protein', servingLabel: '1 butir', calories: 78, protein: 6, carb: 0.6, fat: 5, icon: 'Egg' },
  { name: 'Tempe', category: 'protein', servingLabel: '2 potong', calories: 160, protein: 15, carb: 8, fat: 9, icon: 'Bean' },
  { name: 'Tahu', category: 'protein', servingLabel: '2 potong', calories: 110, protein: 11, carb: 3, fat: 7, icon: 'Bean' },
  { name: 'Mie Goreng', category: 'grain', servingLabel: '1 piring', calories: 520, protein: 12, carb: 70, fat: 20, icon: 'Wheat' },
  { name: 'Sate Ayam', category: 'protein', servingLabel: '10 tusuk', calories: 380, protein: 28, carb: 18, fat: 22, icon: 'Drumstick' },
  { name: 'Gado-gado', category: 'vegetable', servingLabel: '1 porsi', calories: 400, protein: 14, carb: 38, fat: 22, icon: 'Salad' },
  { name: 'Bakso', category: 'protein', servingLabel: '1 mangkok', calories: 330, protein: 18, carb: 30, fat: 15, icon: 'Soup' },
  { name: 'Soto Ayam', category: 'protein', servingLabel: '1 mangkok', calories: 312, protein: 20, carb: 26, fat: 14, icon: 'Soup' },
  { name: 'Pisang', category: 'fruit', servingLabel: '1 buah', calories: 105, protein: 1.3, carb: 27, fat: 0.4, icon: 'Banana' },
  { name: 'Apel', category: 'fruit', servingLabel: '1 buah', calories: 95, protein: 0.5, carb: 25, fat: 0.3, icon: 'Apple' },
  { name: 'Kopi Susu', category: 'beverage', servingLabel: '1 gelas', calories: 150, protein: 4, carb: 22, fat: 5, icon: 'Coffee' },
  { name: 'Teh Manis', category: 'beverage', servingLabel: '1 gelas', calories: 90, protein: 0, carb: 23, fat: 0, icon: 'CupSoda' },
  { name: 'Air Putih', category: 'beverage', servingLabel: '1 gelas', calories: 0, protein: 0, carb: 0, fat: 0, icon: 'GlassWater' },
  { name: 'Roti Tawar', category: 'grain', servingLabel: '1 lembar', calories: 80, protein: 3, carb: 14, fat: 1, icon: 'Sandwich' },
  { name: 'Indomie', category: 'grain', servingLabel: '1 bungkus', calories: 380, protein: 8, carb: 54, fat: 14, icon: 'Wheat' },
  { name: 'Martabak', category: 'snack', servingLabel: '1 potong', calories: 300, protein: 7, carb: 35, fat: 15, icon: 'Cookie' },
  { name: 'Es Teh', category: 'beverage', servingLabel: '1 gelas', calories: 90, protein: 0, carb: 23, fat: 0, icon: 'CupSoda' },
]
