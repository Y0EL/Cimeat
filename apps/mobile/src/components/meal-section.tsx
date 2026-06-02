import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, Sunrise, Sun, Moon, Cookie } from 'lucide-react-native'
import { Text, Pressable } from './ui'
import { FoodLogItem } from './food-log-item'
import { useTheme } from '@/hooks/use-theme'
import { Spacing } from '@/constants/tokens'
import type { FoodLogDto } from '@cimeat/types'

const MEAL_CONFIG: Record<string, { label: string; icon: typeof Sun; hint: string }> = {
  breakfast: { label: 'Sarapan', icon: Sunrise, hint: 'Tap untuk catat sarapan' },
  lunch: { label: 'Makan Siang', icon: Sun, hint: 'Tap untuk catat makan siang' },
  dinner: { label: 'Makan Malam', icon: Moon, hint: 'Tap untuk catat makan malam' },
  snack: { label: 'Camilan', icon: Cookie, hint: 'Tap untuk catat camilan' },
}

interface MealSectionProps {
  mealType: string
  logs: FoodLogDto[]
}

export function MealSection({ mealType, logs }: MealSectionProps) {
  const { colors } = useTheme()
  const router = useRouter()
  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0)
  const config = MEAL_CONFIG[mealType] ?? { label: mealType, icon: Sun, hint: 'Tambah makanan' }
  const Icon = config.icon

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon size={18} color={colors.primary} strokeWidth={1.8} />
          <Text variant="headline">{config.label}</Text>
          {totalCalories > 0 && (
            <Text variant="footnote" color={colors.textTertiary}>
              {totalCalories} kkal
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => router.push('/add-food')}
          style={[styles.addBtn, { backgroundColor: colors.primaryMuted }]}
        >
          <Plus size={16} color={colors.primary} strokeWidth={2.5} />
        </Pressable>
      </View>

      {logs.length === 0 ? (
        <Pressable onPress={() => router.push('/add-food')} style={[styles.emptyArea, { borderColor: colors.border }]}>
          <Text variant="subheadline" color={colors.textTertiary}>
            {config.hint}
          </Text>
        </Pressable>
      ) : (
        logs.map((log) => (
          <FoodLogItem
            key={log.id}
            id={log.id}
            foodName={log.foodName}
            calories={log.calories}
            proteinG={log.proteinG}
            carbsG={log.carbsG}
            fatG={log.fatG}
          />
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArea: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
})
