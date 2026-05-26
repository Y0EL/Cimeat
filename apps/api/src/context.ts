import type { Plan } from '@cimeat/types'

export type AppEnv = {
  Variables: {
    userId: string
    firebaseUid: string
    plan?: Plan
  }
}
