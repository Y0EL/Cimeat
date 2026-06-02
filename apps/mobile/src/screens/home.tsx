import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react-native'
import { Screen, Text, Pressable } from '@/components/ui'
import { CalorieRing } from '@/components/calorie-ring'
import { WaterTracker } from '@/components/water-tracker'
import { MealSection } from '@/components/meal-section'
import { Skeleton } from '@/components/skeleton'
import { ErrorState } from '@/components/error-state'
import { useTheme } from '@/hooks/use-theme'
import { useDailySummary } from '@/hooks/use-summary'
import { useFoodLogs } from '@/hooks/use-food-logs'
import { useAuthStore } from '@/stores/auth-store'
import { Spacing } from '@/constants/tokens'
import type { FoodLogDto } from '@cimeat/types'

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function displayDate(date: Date): string {
  const today = new Date()
  if (formatDate(date) === formatDate(today)) return 'Hari ini'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (formatDate(date) === formatDate(yesterday)) return 'Kemarin'
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export function HomeScreen() {
  const { colors } = useTheme()
  const profile = useAuthStore((s) => s.profile)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const dateStr = formatDate(selectedDate)

  const summary = useDailySummary(dateStr)
  const foodLogs = useFoodLogs(dateStr)

  const logsByMeal = useMemo(() => {
    const grouped: Record<string, FoodLogDto[]> = {
      breakfast: [], lunch: [], dinner: [], snack: [],
    }
    for (const log of foodLogs.data ?? []) {
      const key = log.mealType ?? 'snack'
      if (grouped[key]) grouped[key].push(log)
    }
    return grouped
  }, [foodLogs.data])

  function shiftDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d)
  }

  const consumed = summary.data?.consumed.calories ?? 0
  const goal = summary.data?.goal.calorieGoal ?? 2000
  const firstName = (profile?.name ?? 'Kamu').split(' ')[0]
  const totalLogs = foodLogs.data?.length ?? 0

  return (
    <Screen
      scroll
      refreshing={summary.isFetching || foodLogs.isFetching}
      onRefresh={() => { summary.refetch(); foodLogs.refetch() }}
    >
      <View style={styles.topRow}>
        <View>
          <Text variant="title2">Hai, {firstName}!</Text>
          <View style={styles.streakRow}>
            <Flame size={14} color={colors.primary} fill={colors.primary} />
            <Text variant="caption" color={colors.primary}>
              {totalLogs > 0 ? `${totalLogs} catatan hari ini` : 'Mulai catat!'}
            </Text>
          </View>
        </View>
        <View style={styles.dateChip}>
          <Pressable onPress={() => shiftDate(-1)}>
            <ChevronLeft size={18} color={colors.textPrimary} />
          </Pressable>
          <Text variant="footnote">{displayDate(selectedDate)}</Text>
          <Pressable onPress={() => shiftDate(1)}>
            <ChevronRight size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {summary.isError ? (
        <ErrorState onRetry={() => summary.refetch()} />
      ) : summary.isLoading ? (
        <View style={styles.center}>
          <Skeleton width={220} height={220} borderRadius={110} />
        </View>
      ) : (
        <>
          <CalorieRing consumed={consumed} goal={goal} />

          <View style={styles.macroRow}>
            <MacroCompact
              label="Karbo"
              current={summary.data?.consumed.carb ?? 0}
              goal={summary.data?.goal.carbGoal ?? 0}
              color="#FDE68A"
              fill="#F59E0B"
            />
            <MacroCompact
              label="Protein"
              current={summary.data?.consumed.protein ?? 0}
              goal={summary.data?.goal.proteinGoal ?? 0}
              color="#86EFAC"
              fill="#22C55E"
            />
            <MacroCompact
              label="Lemak"
              current={summary.data?.consumed.fat ?? 0}
              goal={summary.data?.goal.fatGoal ?? 0}
              color="#FCA5A5"
              fill="#EF4444"
            />
          </View>
        </>
      )}

      <WaterTracker />

      <Text variant="caption" color={colors.textTertiary} style={styles.sectionLabel}>
        CATATAN HARI INI
      </Text>

      {MEAL_ORDER.map((meal) => (
        <MealSection key={meal} mealType={meal} logs={logsByMeal[meal] ?? []} />
      ))}

      <View style={styles.bottomSpacer} />
    </Screen>
  )
}

function MacroCompact({
  label, current, goal, color, fill,
}: {
  label: string; current: number; goal: number; color: string; fill: string
}) {
  const { colors } = useTheme()
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0

  return (
    <View style={macroStyles.item}>
      <View style={[macroStyles.bar, { backgroundColor: color }]}>
        <View style={[macroStyles.fill, { width: `${progress * 100}%`, backgroundColor: fill }]} />
      </View>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text variant="caption" color={colors.textPrimary}>
        {Math.round(current)}/{Math.round(goal)}g
      </Text>
    </View>
  )
}

const macroStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 3 },
  bar: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
})

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  center: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
  },
  sectionLabel: {
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  bottomSpacer: {
    height: 110,
  },
})
