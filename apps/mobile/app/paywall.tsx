import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { presentPaywall } from '~/lib/revenuecat'

export default function PaywallScreen() {
  const router = useRouter()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void presentPaywall().finally(() => {
      if (router.canGoBack()) router.back()
      else router.replace('/(tabs)/index')
    })
  }, [router])

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-cream dark:bg-zinc-950">
      <View className="items-center justify-center">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    </SafeAreaView>
  )
}
