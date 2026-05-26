import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatKcal } from '@cimeat/chat-core'
import { DonutChart } from '~/components/donut-chart'
import { LineChart } from '~/components/line-chart'
import { ScreenFade } from '~/components/screen-fade'
import { useGoals } from '~/hooks/use-goals'
import { useFlexTrend, type TrendPeriod } from '~/hooks/use-trend'
import { MACRO_COLORS } from '~/lib/categories'

const PERIODS: { key: TrendPeriod; label: string }[] = [
  { key: 'daily', label: 'Harian' },
  { key: 'weekly', label: 'Mingguan' },
  { key: 'monthly', label: 'Bulanan' },
]

function rangeFor(period: TrendPeriod): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  if (period === 'daily') from.setDate(to.getDate() - 13)
  else if (period === 'weekly') from.setDate(to.getDate() - 7 * 11)
  else from.setMonth(to.getMonth() - 11)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

export default function AnalyticsScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [period, setPeriod] = useState<TrendPeriod>('daily')
  const goals = useGoals()
  const { from, to } = useMemo(() => rangeFor(period), [period])
  const trend = useFlexTrend(period, from, to)

  const data = trend.data ?? []
  const withData = data.filter((d) => d.calories > 0)
  const avgCalories =
    withData.length > 0 ? withData.reduce((s, d) => s + d.calories, 0) / withData.length : 0
  const goalCal = goals.data?.calorieGoal ?? 0
  const onTarget =
    goalCal > 0
      ? withData.filter((d) => Math.abs(d.calories - goalCal) <= goalCal * 0.1).length
      : 0

  const totalProtein = data.reduce((s, d) => s + d.protein, 0)
  const totalCarb = data.reduce((s, d) => s + d.carb, 0)
  const totalFat = data.reduce((s, d) => s + d.fat, 0)
  const macroSlices = [
    { name: 'Protein', total: totalProtein * 4, color: MACRO_COLORS.protein },
    { name: 'Karbo', total: totalCarb * 4, color: MACRO_COLORS.carb },
    { name: 'Lemak', total: totalFat * 9, color: MACRO_COLORS.fat },
  ]

  const chartWidth = width - 56

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-row items-center gap-2 px-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-zinc-900"
          >
            <ChevronLeft size={20} color="#71717a" />
          </Pressable>
          <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Analitik
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
          <View className="flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            {PERIODS.map((p) => {
              const active = period === p.key
              return (
                <Pill
                  key={p.key}
                  label={p.label}
                  active={active}
                  onPress={() => setPeriod(p.key)}
                />
              )
            })}
          </View>

          <View className="mt-4 flex-row gap-3">
            <Stat label="Rata-rata harian" value={formatKcal(avgCalories)} />
            <Stat label="Hari on-target" value={`${onTarget} hari`} />
          </View>

          <View className="mt-4 rounded-card bg-white p-4 dark:bg-zinc-900">
            <Text className="mb-3 font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Tren kalori
            </Text>
            {data.length > 0 ? (
              <LineChart data={data} width={chartWidth} period={period} />
            ) : (
              <View className="items-center py-10">
                <Text className="font-sans text-sm text-zinc-400">Belum ada data</Text>
              </View>
            )}
          </View>

          <View className="mt-4 items-center rounded-card bg-white p-4 dark:bg-zinc-900">
            <Text className="mb-3 self-start font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Sebaran makro (kalori)
            </Text>
            <DonutChart slices={macroSlices} centerLabel="Periode" centerValue={`${data.length}`} />
            <View className="mt-3 flex-row gap-4">
              <Legend color={MACRO_COLORS.protein} label="Protein" />
              <Legend color={MACRO_COLORS.carb} label="Karbo" />
              <Legend color={MACRO_COLORS.fat} label="Lemak" />
            </View>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        active
          ? 'flex-1 items-center rounded-full bg-primary-600 py-2'
          : 'flex-1 items-center rounded-full py-2'
      }
    >
      <Text
        className={
          active
            ? 'font-sans text-xs font-semibold text-white'
            : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
        }
      >
        {label}
      </Text>
    </Pressable>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-card bg-white p-4 dark:bg-zinc-900">
      <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">{label}</Text>
      <Text className="mt-1 font-display text-lg font-bold text-primary-600 dark:text-primary-300">
        {value}
      </Text>
    </View>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">{label}</Text>
    </View>
  )
}
