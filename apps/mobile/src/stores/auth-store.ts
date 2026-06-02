import { create } from 'zustand'
import { onAuthStateChanged, signOut as firebaseSignOut, signInAnonymously } from 'firebase/auth'
import type { User } from 'firebase/auth'
import type { UserProfile, NutritionGoalDto, FoodDto } from '@cimeat/types'
import { auth, isFirebaseConfigured } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'

interface SessionResponse {
  profile: UserProfile
  goal: NutritionGoalDto | null
  foods: FoodDto[]
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  goal: NutritionGoalDto | null
  foods: FoodDto[]
  isLoading: boolean
  isNewUser: boolean

  initialize: () => () => void
  createSession: () => Promise<void>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  setProfile: (p: UserProfile) => void
  setGoal: (g: NutritionGoalDto) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  goal: null,
  foods: [],
  isLoading: true,
  isNewUser: false,

  initialize() {
    if (!isFirebaseConfigured) {
      set({ isLoading: false })
      return () => {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        set({ user: firebaseUser })
        try {
          await get().createSession()
        } catch {
          set({ isLoading: false })
        }
      } else {
        set({ user: null, profile: null, goal: null, foods: [], isLoading: false })
      }
    })
    return unsubscribe
  },

  async createSession() {
    try {
      const data = await apiFetch<SessionResponse>('/v1/auth/session', { method: 'POST' })
      const needsOnboarding = !data.profile.heightCm || !data.profile.weightKg
      set({
        profile: data.profile,
        goal: data.goal,
        foods: data.foods,
        isNewUser: needsOnboarding,
        isLoading: false,
      })
    } catch {
      set({ isNewUser: true, isLoading: false })
    }
  },

  async signInAsGuest() {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured')
    await signInAnonymously(auth)
  },

  async signOut() {
    try {
      if (isFirebaseConfigured) {
        await firebaseSignOut(auth)
      }
    } catch {
      // ignore firebase errors
    }
    set({ user: null, profile: null, goal: null, foods: [], isNewUser: false })
  },

  setProfile(p) {
    set({ profile: p, isNewUser: false })
  },

  setGoal(g) {
    set({ goal: g })
  },
}))
