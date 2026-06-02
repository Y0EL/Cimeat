import { useState } from 'react'
import { StyleSheet, View, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Screen, Text, Card, Button, Pressable } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { useCreateFoodLog } from '@/hooks/use-food-logs'
import { Spacing } from '@/constants/tokens'
import type { MealType } from '@cimeat/types'

const MEALS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Sarapan' },
  { key: 'lunch', label: 'Siang' },
  { key: 'dinner', label: 'Malam' },
  { key: 'snack', label: 'Camilan' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function AnalysisResultScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ result: string }>()
  const data = params.result ? JSON.parse(params.result) : null
  const createLog = useCreateFoodLog(todayStr())

  const [mealType, setMealType] = useState<MealType>('lunch')

  if (!data) {
    router.back()
    return null
  }

  function handleSave() {
    createLog.mutate(
      {
        source: 'vision',
        mealType,
        foodName: data.food_name,
        estimatedWeightG: data.estimated_weight_g,
        calories: data.calories,
        proteinG: data.macronutrients.protein_g,
        carbsG: data.macronutrients.carbs_g,
        fatG: data.macronutrients.fat_g,
        healthScore: data.health_score,
        confidenceScore: data.confidence_score,
        eatenAt: new Date().toISOString(),
      },
      {
        onSuccess() {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          router.dismissAll()
          router.replace('/(tabs)')
        },
        onError() {
          Alert.alert('Gagal', 'Tidak bisa menyimpan catatan makanan')
        },
      },
    )
  }

  return (
    <Screen scroll>
      <Text variant="title1" style={styles.title}>
        {data.food_name}
      </Text>

      <Card style={styles.nutritionCard}>
        <View style={styles.calorieRow}>
          <Text variant="largeTitle">{data.calories}</Text>
          <Text variant="subheadline" color={colors.textSecondary}>
            kkal
          </Text>
        </View>

        <View style={styles.macroRow}>
          <MacroItem label="Protein" value={data.macronutrients.protein_g} colors={colors} />
          <MacroItem label="Karbo" value={data.macronutrients.carbs_g} colors={colors} />
          <MacroItem label="Lemak" value={data.macronutrients.fat_g} colors={colors} />
        </View>
      </Card>

      {data.cimit_message && (
        <Card style={styles.cimitCard}>
          <Text variant="subheadline" color={colors.textSecondary}>
            {data.cimit_message}
          </Text>
        </Card>
      )}

      <Text variant="headline" style={styles.mealLabel}>
        Waktu makan
      </Text>
      <View style={styles.mealRow}>
        {MEALS.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => setMealType(m.key)}
            style={[
              styles.mealPill,
              {
                backgroundColor: mealType === m.key ? colors.primary : colors.surface,
                borderColor: mealType === m.key ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              variant="subheadline"
              color={mealType === m.key ? '#FFFFFF' : colors.textPrimary}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Button title="Simpan" onPress={handleSave} loading={createLog.isPending} />
        <Button title="Batal" onPress={() => router.back()} variant="ghost" />
      </View>
    </Screen>
  )
}

function MacroItem({
  label,
  value,
  colors,
}: {
  label: string
  value: number
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <View style={styles.macroItem}>
      <Text variant="headline">{Math.round(value)}g</Text>
      <Text variant="caption" color={colors.textTertiary}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    paddingTop: Spacing.lg,
  },
  nutritionCard: {
    marginTop: Spacing.xl,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
  },
  macroItem: {
    alignItems: 'center',
    gap: 2,
  },
  cimitCard: {
    marginTop: Spacing.md,
  },
  mealLabel: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mealPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  actions: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
})
