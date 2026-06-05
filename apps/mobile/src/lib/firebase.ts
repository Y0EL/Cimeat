import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
    if (getApps().length === 0) {
      const app = initializeApp(firebaseConfig)
      try {
        return initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        })
      } catch {
        // AsyncStorage tidak kompatibel di environment ini, fallback ke memory
        return getAuth(app)
      }
    }
    return getAuth(getApp())
  } catch {
    return null
  }
}

export const auth = initFirebase()!

export const isFirebaseConfigured = auth !== null && !!firebaseConfig.apiKey
