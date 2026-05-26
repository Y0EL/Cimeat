import { describe, expect, it } from 'vitest'
import { decodeCursor, encodeCursor } from './meal-service'
import { computeGoalFromProfile } from './nutrition-util'

describe('meal cursor encode/decode', () => {
  it('round trips', () => {
    const cursor = { loggedAt: '2026-05-20T10:00:00.000Z', id: 'abc-123' }
    const decoded = decodeCursor(encodeCursor(cursor))
    expect(decoded).toEqual(cursor)
  })

  it('returns null when separator missing', () => {
    const encoded = Buffer.from('nopipe').toString('base64url')
    expect(decodeCursor(encoded)).toBeNull()
  })
})

describe('computeGoalFromProfile', () => {
  it('falls back to a 2000 kcal default when metrics are missing', () => {
    const goal = computeGoalFromProfile({
      sex: null,
      birthYear: null,
      heightCm: null,
      weightKg: null,
      activityLevel: null,
      goalType: null,
    })
    expect(goal.calorieGoal).toBe(2000)
    expect(goal.goalType).toBe('maintain')
  })

  it('computes TDEE via Mifflin-St Jeor and applies goal adjustment', () => {
    // male, born 1996 (~30yo in 2026), 175cm, 70kg, moderate, lose
    const goal = computeGoalFromProfile({
      sex: 'male',
      birthYear: 1996,
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate',
      goalType: 'lose',
    })
    // BMR = 10*70 + 6.25*175 - 5*30 + 5 = 1648.75; *1.55 = 2555.56; -500 = ~2056
    expect(goal.calorieGoal).toBeGreaterThan(1900)
    expect(goal.calorieGoal).toBeLessThan(2200)
    expect(goal.proteinGoal).toBe(140) // 2g/kg * 70
    expect(goal.goalType).toBe('lose')
    expect(goal.carbGoal).toBeGreaterThan(0)
  })
})
