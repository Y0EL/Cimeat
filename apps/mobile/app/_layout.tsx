import '~/lib/reanimated-init'
import '../global.css'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Outfit_400Regular,
  Outfit_700Bold,
  Outfit_900Black,
  useFonts,
} from '@expo-google-fonts/outfit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { colorScheme, useColorScheme } from 'nativewind'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '~/hooks/use-auth'
import { useBootstrapSession } from '~/hooks/use-bootstrap-session'
import { getFirebaseAuth } from '~/lib/firebase'
import { configurePurchases, identifyUser, signOutPurchases } from '~/lib/revenuecat'
import { EditMealProvider } from '~/lib/edit-store'
import { LangProvider } from '~/lib/lang-context'
import { ThemeProvider } from '~/lib/theme'
import { ONBOARDING_KEY } from './onboarding'

colorScheme.set('light')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 },
  },
})

const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY ?? ''

function AuthGate() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [onboardingReady, setOnboardingReady] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(false)

  useBootstrapSession(Boolean(user))

  useEffect(() => {
    if (user?.uid) identifyUser(user.uid).catch(() => {})
    else signOutPurchases().catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setOnboardingDone(v === '1'))
      .catch(() => {})
      .finally(() => setOnboardingReady(true))
  }, [])

  useEffect(() => {
    if (loading || !onboardingReady) return
    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
      return
    }
    if (user && !onboardingDone && !inOnboarding) {
      router.replace('/onboarding')
      return
    }
    if (user && onboardingDone && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/index')
    }
  }, [user, loading, segments, router, onboardingReady, onboardingDone])

  if (loading || !onboardingReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7F4' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }}>
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="cimit" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="goals" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="foods" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="log"
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="paywall"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  const { colorScheme: scheme } = useColorScheme()
  const [fontsLoaded] = useFonts({ Outfit_400Regular, Outfit_700Bold, Outfit_900Black })

  useEffect(() => {
    getFirebaseAuth()
    configurePurchases(REVENUECAT_KEY)
  }, [])

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7F4' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    )
  }

  return (
    <LangProvider>
      <ThemeProvider>
        <EditMealProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <AuthGate />
                <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </EditMealProvider>
      </ThemeProvider>
    </LangProvider>
  )
}
