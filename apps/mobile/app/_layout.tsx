import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit'
import * as SplashScreen from 'expo-splash-screen'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth-store'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize)

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  })

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="add-food" options={{ presentation: 'modal' }} />
        <Stack.Screen name="analysis-result" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goals" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  )
}
