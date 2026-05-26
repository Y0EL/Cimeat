import { describe, expect, it } from 'vitest'
import { decodeCursor, encodeCursor } from './foodlog-service'
import { computeGoalFromProfile } from './nutrition-util'

describe('food log cursor encode/decode', () => {
  it('round trips', () => {
    const cursor = { eatenAt: '2026-05-20T10:00:00.000Z', id: 'abc-123' }
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
  })

  it('computes a goal from full metrics', () => {
    const goal = computeGoalFromProfile({
      sex: 'male',
      birthYear: 1995,
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate',
      goalType: 'maintain',
    })
    expect(goal.calorieGoal).toBeGreaterThan(1000)
    expect(goal.proteinGoal).toBeGreaterThan(0)
  })
})
