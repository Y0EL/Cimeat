import { useState } from 'react'
import { StyleSheet, View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Minus, Plus } from 'lucide-react-native'
import { Screen, Text, Button, Input, Pressable } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { useUpsertGoal } from '@/hooks/use-goals'
import { useAuthStore } from '@/stores/auth-store'
import { Spacing, Radius } from '@/constants/tokens'
import type { GoalType } from '@cimeat/types'

const GOALS: { key: GoalType; label: string }[] = [
  { key: 'lose', label: 'Turunkan' },
  { key: 'maintain', label: 'Jaga' },
  { key: 'gain', label: 'Naikkan' },
]

export function GoalsScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const currentGoal = useAuthStore((s) => s.goal)
  const upsertGoal = useUpsertGoal()

  const [goalType, setGoalType] = useState<GoalType>(currentGoal?.goalType ?? 'maintain')
  const [calories, setCalories] = useState(String(currentGoal?.calorieGoal ?? 2000))
  const [protein, setProtein] = useState(String(currentGoal?.proteinGoal ?? 0))
  const [carb, setCarb] = useState(String(currentGoal?.carbGoal ?? 0))
  const [fat, setFat] = useState(String(currentGoal?.fatGoal ?? 0))

  function adjustCalories(delta: number) {
    const current = parseInt(calories, 10) || 0
    setCalories(String(Math.max(500, current + delta)))
  }

  function handleSave() {
    upsertGoal.mutate(
      {
        goalType,
        calorieGoal: parseInt(calories, 10) || 2000,
        proteinGoal: parseFloat(protein) || 0,
        carbGoal: parseFloat(carb) || 0,
        fatGoal: parseFloat(fat) || 0,
      },
      {
        onSuccess() {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          router.back()
        },
        onError() {
          Alert.alert('Gagal', 'Tidak bisa menyimpan target')
        },
      },
    )
  }

  return (
    <Screen scroll>
      <Text variant="title1" style={styles.title}>
        Target Harian
      </Text>

      <View style={styles.goalRow}>
        {GOALS.map((g) => (
          <Pressable
            key={g.key}
            onPress={() => setGoalType(g.key)}
            style={[
              styles.goalPill,
              {
                backgroundColor: goalType === g.key ? colors.textPrimary : 'transparent',
                borderColor: goalType === g.key ? colors.textPrimary : colors.border,
              },
            ]}
          >
            <Text
              variant="headline"
              color={goalType === g.key ? colors.background : colors.textPrimary}
            >
              {g.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.calorieSection}>
        <Text variant="headline">Kalori</Text>
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => adjustCalories(-50)}
            style={[styles.stepperButton, { borderColor: colors.border }]}
          >
            <Minus size={20} color={colors.textPrimary} />
          </Pressable>
          <Text variant="title1" style={styles.calorieValue}>
            {calories}
          </Text>
          <Pressable
            onPress={() => adjustCalories(50)}
            style={[styles.stepperButton, { borderColor: colors.border }]}
          >
            <Plus size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
        <Text variant="caption" color={colors.textTertiary} align="center">
          kkal per hari
        </Text>
      </View>

      <View style={styles.macroSection}>
        <Text variant="headline" style={styles.macroTitle}>
          Makro (gram)
        </Text>
        <View style={styles.macroRow}>
          <Input
            label="Protein"
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            containerStyle={styles.macroInput}
          />
          <Input
            label="Karbo"
            value={carb}
            onChangeText={setCarb}
            keyboardType="decimal-pad"
            containerStyle={styles.macroInput}
          />
          <Input
            label="Lemak"
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            containerStyle={styles.macroInput}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Simpan" onPress={handleSave} loading={upsertGoal.isPending} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  goalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  goalPill: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  calorieSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginVertical: Spacing.lg,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieValue: {
    minWidth: 100,
    textAlign: 'center',
  },
  macroSection: {
    marginBottom: Spacing.xxl,
  },
  macroTitle: {
    marginBottom: Spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  macroInput: {
    flex: 1,
  },
  actions: {
    paddingBottom: Spacing.xxl,
  },
})
