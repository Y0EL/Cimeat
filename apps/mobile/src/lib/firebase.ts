import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import Constants from 'expo-constants'

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain:
    Constants.expoConfig?.extra?.firebaseAuthDomain ??
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId:
    Constants.expoConfig?.extra?.firebaseProjectId ??
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  appId: Constants.expoConfig?.extra?.firebaseAppId ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
}

function initFirebase() {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    return getAuth(app)
  } catch {
    return null
  }
}

export const auth = initFirebase()!

export const isFirebaseConfigured = auth !== null && !!firebaseConfig.apiKey
