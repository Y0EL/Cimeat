const fs = require('fs')
const path = require('path')

const envPath = path.resolve(__dirname, '../../.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    const value = trimmed.slice(eqIndex + 1).replace(/^["']|["']$/g, '')
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

module.exports = {
  expo: {
    name: 'Cimeat',
    slug: 'cimeat',
    version: '1.0.0',
    owner: 'y0el',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'cimeat',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.cimeat.app',
      infoPlist: {
        NSCameraUsageDescription: 'Cimeat memerlukan akses kamera untuk memfoto makanan',
        NSMicrophoneUsageDescription: 'Cimeat memerlukan mikrofon untuk input suara',
        NSPhotoLibraryUsageDescription: 'Cimeat memerlukan akses galeri untuk memilih foto makanan',
      },
    },
    android: {
      package: 'com.cimeat.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0A0A',
      },
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-image-picker',
      'expo-secure-store',
      '@react-native-google-signin/google-signin',
    ],
    extra: {
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyABN-ZMvZry3003n00Ao_2wpViEsGpOgpE',
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'cimeat-id.firebaseapp.com',
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'cimeat-id',
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:396423070743:web:b5daac16ed735ff2cac852',
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || '396423070743-rvpjviacg6oktt1a5g19q1kan81v7av1.apps.googleusercontent.com',
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://cimeat-api.fly.dev',
      deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
      eas: {
        projectId: '14b6f806-ea45-4fa5-8998-2671922f2830',
      },
    },
  },
}
