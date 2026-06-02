import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native'
import { Screen, Text, Pressable } from '@/components/ui'
import { FoodLogItem } from '@/components/food-log-item'
import { EmptyState } from '@/components/empty-state'
import { useTheme } from '@/hooks/use-theme'
import { useFoodLogs, useDeleteFoodLog } from '@/hooks/use-food-logs'
import { Spacing } from '@/constants/tokens'
import { UtensilsCrossed } from 'lucide-react-native'
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
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan Siang',
  dinner: 'Makan Malam',
  snack: 'Camilan',
}

export function LogScreen() {
  const { colors } = useTheme()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const dateStr = formatDate(selectedDate)
  const foodLogs = useFoodLogs(dateStr)
  const deleteMutation = useDeleteFoodLog(dateStr)

  const grouped = useMemo(() => {
    const map: Record<string, FoodLogDto[]> = {}
    for (const meal of MEAL_ORDER) map[meal] = []
    for (const log of foodLogs.data ?? []) {
      const key = log.mealType ?? 'snack'
      if (map[key]) map[key].push(log)
    }
    return MEAL_ORDER
      .filter((m) => (map[m]?.length ?? 0) > 0)
      .map((m) => ({
        meal: m,
        label: MEAL_LABELS[m] ?? m,
        items: map[m] ?? [],
        total: (map[m] ?? []).reduce((s, l) => s + l.calories, 0),
      }))
  }, [foodLogs.data])

  function shiftDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d)
  }

  const totalItems = foodLogs.data?.length ?? 0

  return (
    <Screen
      scroll
      refreshing={foodLogs.isFetching}
      onRefresh={() => foodLogs.refetch()}
    >
      <Text variant="title1" style={styles.title}>Riwayat</Text>

      <View style={styles.dateRow}>
        <Pressable onPress={() => shiftDate(-1)} style={styles.dateArrow}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text variant="headline">{displayDate(selectedDate)}</Text>
        <Pressable onPress={() => shiftDate(1)} style={styles.dateArrow}>
          <ChevronRight size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {totalItems > 0 && (
        <View style={[styles.summaryRow, { backgroundColor: colors.surface }]}>
          <Text variant="subheadline" color={colors.textSecondary}>
            {totalItems} makanan dicatat
          </Text>
          <Text variant="headline" color={colors.primary}>
            {(foodLogs.data ?? []).reduce((s, l) => s + l.calories, 0)} kkal
          </Text>
        </View>
      )}

      {totalItems === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Belum ada catatan"
          subtitle="Tekan + untuk mulai catat makanan"
        />
      ) : (
        grouped.map((g) => (
          <View key={g.meal} style={styles.mealGroup}>
            <View style={styles.mealHeader}>
              <Text variant="headline">{g.label}</Text>
              <View style={[styles.kcalBadge, { backgroundColor: colors.primaryMuted }]}>
                <Text variant="caption" color={colors.primary}>{g.total} kkal</Text>
              </View>
            </View>

            {g.items.map((item) => (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surface }]}>
                <View style={styles.itemContent}>
                  <View style={styles.itemLeft}>
                    <Text variant="body" numberOfLines={1}>{item.foodName}</Text>
                    <Text variant="caption" color={colors.textTertiary}>
                      P {Math.round(item.proteinG)}g · K {Math.round(item.carbsG)}g · L {Math.round(item.fatG)}g
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text variant="headline">{item.calories}</Text>
                    <Text variant="caption" color={colors.textTertiary}>kkal</Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <Pressable
                    onPress={() => deleteMutation.mutate(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={14} color={colors.destructive} />
                    <Text variant="caption" color={colors.destructive}>Hapus</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ))
      )}

      <View style={styles.bottomSpacer} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { paddingTop: Spacing.lg, marginBottom: Spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.xl },
  dateArrow: { padding: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: Spacing.lg },
  mealGroup: { marginBottom: Spacing.xl },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm, paddingHorizontal: 4 },
  kcalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  itemCard: { borderRadius: 16, padding: 14, marginBottom: 8 },
  itemContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemLeft: { flex: 1, gap: 2, marginRight: 12 },
  itemRight: { alignItems: 'flex-end' },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  bottomSpacer: { height: 110 },
})
