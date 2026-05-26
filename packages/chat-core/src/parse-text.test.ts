import { describe, expect, it } from 'vitest'
import {
  detectFoodCategory,
  detectMealType,
  parseCaloriesFromText,
  parseQuickAddText,
} from './parse-text'

describe('parseCaloriesFromText', () => {
  it('parses plain kkal', () => {
    expect(parseCaloriesFromText('nasi goreng 600 kkal')).toBe(600)
  })

  it('parses kal without space', () => {
    expect(parseCaloriesFromText('kopi 50kal')).toBe(50)
  })

  it('parses k multiplier', () => {
    expect(parseCaloriesFromText('cheat day 1.2k kkal')).toBe(1200)
  })

  it('parses decimal with comma', () => {
    expect(parseCaloriesFromText('snack 12,5 kal')).toBe(13)
  })

  it('returns null when no calorie figure', () => {
    expect(parseCaloriesFromText('makan nasi goreng')).toBeNull()
  })
})

describe('detectFoodCategory', () => {
  it('detects protein', () => {
    expect(detectFoodCategory('ayam bakar')).toBe('protein')
  })

  it('detects beverage', () => {
    expect(detectFoodCategory('kopi susu')).toBe('beverage')
  })

  it('falls back to other', () => {
    expect(detectFoodCategory('xyz random')).toBe('other')
  })
})

describe('detectMealType', () => {
  it('detects breakfast', () => {
    expect(detectMealType('sarapan roti')).toBe('breakfast')
  })

  it('returns null when no meal-type hint', () => {
    expect(detectMealType('nasi goreng')).toBeNull()
  })
})

describe('parseQuickAddText', () => {
  it('returns high confidence with name and calories', () => {
    const result = parseQuickAddText('nasi goreng 600 kkal')
    expect(result).toEqual({
      name: 'nasi goreng',
      calories: 600,
      category: 'grain',
      mealType: null,
      confidence: 'high',
    })
  })

  it('returns medium confidence when category known but no calories', () => {
    const result = parseQuickAddText('ayam bakar')
    expect(result?.confidence).toBe('medium')
    expect(result?.calories).toBeNull()
  })

  it('extracts meal type and strips it from name', () => {
    const result = parseQuickAddText('sarapan roti 150 kkal')
    expect(result?.mealType).toBe('breakfast')
    expect(result?.name).toBe('roti')
  })

  it('returns null for empty input', () => {
    expect(parseQuickAddText('   ')).toBeNull()
  })
})
