import { Stack } from 'expo-router'
import { AnalysisResultScreen } from '@/screens/analysis-result'
import { useTheme } from '@/hooks/use-theme'

export default function AnalysisResultRoute() {
  const { colors } = useTheme()

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Hasil Analisis',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <AnalysisResultScreen />
    </>
  )
}
