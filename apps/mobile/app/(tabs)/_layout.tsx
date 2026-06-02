import { Redirect, Tabs } from 'expo-router'
import { useAuthStore } from '@/stores/auth-store'
import { CustomTabBar } from '@/components/custom-tab-bar'

export default function TabLayout() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isNewUser = useAuthStore((s) => s.isNewUser)

  if (isLoading) return null
  if (!user) return <Redirect href="/(auth)/login" />
  if (isNewUser) return <Redirect href="/onboarding" />

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
