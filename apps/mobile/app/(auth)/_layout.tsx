import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@/stores/auth-store'

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isNewUser = useAuthStore((s) => s.isNewUser)

  if (isLoading) return null

  if (user && isNewUser) return <Redirect href="/onboarding" />
  if (user) return <Redirect href="/(tabs)" />

  return <Stack screenOptions={{ headerShown: false }} />
}
