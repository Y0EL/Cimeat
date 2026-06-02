import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Sparkles, Zap, Flame, ChefHat } from 'lucide-react-native'
import { Screen, Text, Pressable } from '@/components/ui'
import { Skeleton } from '@/components/skeleton'
import { useTheme } from '@/hooks/use-theme'
import { useDailySummary, useTrend } from '@/hooks/use-summary'
import { useFoodLogs } from '@/hooks/use-food-logs'
import { useAuthStore } from '@/stores/auth-store'
import { Spacing } from '@/constants/tokens'

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function weekAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return formatDate(d)
}

export function ProgressScreen() {
  const { colors } = useTheme()
  const goal = useAuthStore((s) => s.goal)
  const today = formatDate(new Date())
  const summary = useDailySummary(today)
  const trend = useTrend('daily', weekAgo(), today)
  const foodLogs = useFoodLogs(today)

  const todayCount = foodLogs.data?.length ?? 0

  const weeklyData = useMemo(() => {
    if (!trend.data) return []
    return trend.data.slice(-7)
  }, [trend.data])

  const weeklyAvg = useMemo(() => {
    if (!weeklyData.length) return 0
    return Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / weeklyData.length)
  }, [weeklyData])

  const maxCal = useMemo(() => {
    const g = goal?.calorieGoal ?? 2000
    const dataMax = weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.calories)) : 0
    return Math.max(dataMax, g) * 1.15 || g
  }, [weeklyData, goal])

  return (
    <Screen scroll>
      <Text variant="title1" style={styles.title}>Progres</Text>

      <View style={styles.coachCard}>
        <View style={styles.coachHeader}>
          <View style={styles.coachIconWrap}>
            <Sparkles size={18} color="#FFFFFF" />
          </View>
          <Text variant="headline" color="#FFFFFF">AI Coach</Text>
        </View>
        <Text variant="subheadline" color="rgba(255,255,255,0.75)" style={styles.coachText}>
          {todayCount > 0
            ? `Kamu sudah catat ${todayCount} makanan hari ini. Terus pantau asupanmu!`
            : 'Belum ada catatan hari ini. Yuk mulai catat makananmu!'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
            <Zap size={22} color={colors.primary} />
          </View>
          <View>
            <Text variant="headline">Nutrisi Makro</Text>
            <Text variant="caption" color={colors.textTertiary}>Target harian</Text>
          </View>
        </View>
        <View style={styles.macroList}>
          <MacroRow label="Protein" current={summary.data?.consumed.protein ?? 0} target={summary.data?.goal.proteinGoal ?? 0} color="#86EFAC" fill="#22C55E" />
          <MacroRow label="Karbo" current={summary.data?.consumed.carb ?? 0} target={summary.data?.goal.carbGoal ?? 0} color="#FDE68A" fill="#F59E0B" />
          <MacroRow label="Lemak" current={summary.data?.consumed.fat ?? 0} target={summary.data?.goal.fatGoal ?? 0} color="#FCA5A5" fill="#EF4444" />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.streakHeader}>
          <View>
            <Text variant="caption" color={colors.textTertiary} style={styles.label}>STREAK MINGGUAN</Text>
            <View style={styles.streakValue}>
              <Text variant="title1">{weeklyData.filter((d) => d.calories > 0).length}</Text>
              <Text variant="subheadline" color={colors.primary}> hari</Text>
            </View>
          </View>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
            <Flame size={24} color={colors.primary} fill={colors.primary} />
          </View>
        </View>

        <View style={[styles.chartBox, { backgroundColor: colors.background }]}>
          <View style={styles.chartHeader}>
            <Text variant="caption" color={colors.textTertiary} style={styles.label}>GRAFIK KALORI</Text>
            <Text variant="caption" color={colors.primary}>Avg: {weeklyAvg} kkal</Text>
          </View>

          {trend.isLoading ? (
            <Skeleton width="100%" height={80} borderRadius={8} />
          ) : (
            <View style={styles.bars}>
              {(weeklyData.length > 0 ? weeklyData : Array.from({ length: 7 }, (_, i) => ({ calories: 0, label: `${i}` }))).map((d, i) => {
                const h = maxCal > 0 ? Math.max((d.calories / maxCal) * 80, 3) : 3
                const isOver = d.calories > (goal?.calorieGoal ?? 2000)
                const dayLabel = d.label?.slice(-2) ?? ''
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barSpace}>
                      <View style={{ height: h, backgroundColor: isOver ? colors.destructive : colors.primary, borderRadius: 4, width: '100%' }} />
                    </View>
                    <Text variant="caption" color={colors.textTertiary} style={styles.barDay}>
                      {dayLabel}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View style={[styles.weekMacroSection, { borderTopColor: colors.border }]}>
          <Text variant="caption" color={colors.textTertiary} style={styles.label}>TOTAL MAKRO MINGGU INI</Text>
          <View style={styles.macroList}>
            <MacroRow
              label="Protein"
              current={weeklyData.reduce((s, d) => s + d.protein, 0)}
              target={(summary.data?.goal.proteinGoal ?? 0) * 7}
              color="#86EFAC" fill="#22C55E"
            />
            <MacroRow
              label="Karbo"
              current={weeklyData.reduce((s, d) => s + d.carb, 0)}
              target={(summary.data?.goal.carbGoal ?? 0) * 7}
              color="#FDE68A" fill="#F59E0B"
            />
            <MacroRow
              label="Lemak"
              current={weeklyData.reduce((s, d) => s + d.fat, 0)}
              target={(summary.data?.goal.fatGoal ?? 0) * 7}
              color="#FCA5A5" fill="#EF4444"
            />
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </Screen>
  )
}

function MacroRow({
  label, current, target, color, fill,
}: {
  label: string; current: number; target: number; color: string; fill: string
}) {
  const { colors } = useTheme()
  const pct = target > 0 ? Math.min(current / target, 1) : 0
  return (
    <View style={macroStyles.row}>
      <Text variant="subheadline" style={macroStyles.label}>{label}</Text>
      <View style={[macroStyles.bar, { backgroundColor: color }]}>
        <View style={[macroStyles.fill, { width: `${pct * 100}%`, backgroundColor: fill }]} />
      </View>
      <Text variant="footnote" color={colors.textSecondary} style={macroStyles.value}>
        {Math.round(current)}/{Math.round(target)}g
      </Text>
    </View>
  )
}

const macroStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { width: 60 },
  bar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  value: { width: 75, textAlign: 'right' },
})

const styles = StyleSheet.create({
  title: { paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  coachCard: { backgroundColor: '#2A2D30', borderRadius: 24, padding: 20, marginBottom: Spacing.md },
  coachHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  coachIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  coachText: { lineHeight: 22 },
  card: { borderRadius: 24, padding: 20, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  macroList: { gap: 12 },
  streakHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  label: { letterSpacing: 1.5, marginBottom: 4 },
  streakValue: { flexDirection: 'row', alignItems: 'baseline' },
  chartBox: { borderRadius: 16, padding: 14, marginBottom: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 90, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barSpace: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  barDay: { fontSize: 10 },
  weekMacroSection: { borderTopWidth: 1, paddingTop: 16 },
  bottomSpacer: { height: 110 },
})
