import { useQueryClient } from '@tanstack/react-query'
import { useFocusEffect, useRouter } from 'expo-router'
import { Plus, UtensilsCrossed } from 'lucide-react-native'
import { useCallback, useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { FoodLogDto, MealType } from '@cimeat/types'
import { formatKcal } from '@cimeat/chat-core'
import { CalorieRing } from '~/components/calorie-ring'
import { CimitAdviceCard } from '~/components/cimit/cimit-advice-card'
import { MacroBarRow } from '~/components/macro-bar'
import { MealCard } from '~/components/meal-card'
import { PlanBadge } from '~/components/plan-badge'
import { ScreenFade } from '~/components/screen-fade'
import { useAuth } from '~/hooks/use-auth'
import { useDailyAdvice, useRoast } from '~/hooks/use-cimit'
import { useFoodLogs } from '~/hooks/use-food-logs'
import { useProfile } from '~/hooks/use-summary'
import { useDailySummary, todayDate } from '~/hooks/use-summary'
import { useSubscription } from '~/hooks/use-subscription'

const MEAL_GROUPS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Sarapan', emoji: '🍳' },
  { type: 'lunch', label: 'Makan Siang', emoji: '🍱' },
  { type: 'dinner', label: 'Makan Malam', emoji: '🍲' },
  { type: 'snack', label: 'Camilan', emoji: '🍪' },
]

const ringShadow = {
  shadowColor: '#ea580c',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 24,
  elevation: 8,
}

export default function HomeTab() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const profile = useProfile()
  const { plan } = useSubscription()
  const firstName = user?.displayName?.split(' ')[0] ?? 'kamu'
  const initial = (user?.displayName ?? user?.email ?? 'C').charAt(0).toUpperCase()

  const today = todayDate()
  const summary = useDailySummary(today)
  const start = `${today}T00:00:00.000Z`
  const end = `${today}T23:59:59.999Z`
  const logs = useFoodLogs({ from: start, to: end })

  const offside = summary.data?.offsideAmount ?? 0
  const isRoast = offside > 0
  const advice = useDailyAdvice()
  const roast = useRoast()
  const tone = profile.data?.cimitTone ?? 'normal'

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
    }, [queryClient]),
  )

  const allLogs = logs.data?.pages.flatMap((p) => p.items) ?? []
  const grouped = useMemo(() => {
    const map = new Map<MealType, FoodLogDto[]>()
    for (const m of allLogs) {
      if (!m.mealType) continue
      const list = map.get(m.mealType) ?? []
      list.push(m)
      map.set(m.mealType, list)
    }
    return map
  }, [allLogs])

  const consumed = summary.data?.consumed
  const goal = summary.data?.goal
  const calorieGoal = goal?.calorieGoal ?? 2000

  const cimitMessage = isRoast ? roast.data?.message : advice.data?.message
  const cimitLoading = isRoast ? roast.isPending : advice.isLoading

  const maybeRoast = useCallback(() => {
    if (isRoast && !roast.data && !roast.isPending) roast.mutate()
  }, [isRoast, roast])
  useFocusEffect(maybeRoast)

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between px-4 pt-3">
            <View>
              <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">
                Halo, {firstName} 👋
              </Text>
              <Text className="font-display text-2xl font-extrabold text-primary-600 dark:text-primary-300">
                Cimeat
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <PlanBadge plan={plan} onPress={() => router.push('/profile')} />
              <Pressable
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="Profil"
                className="h-11 w-11 items-center justify-center rounded-full bg-primary-100 active:opacity-70 dark:bg-primary-950"
              >
                <Text className="font-display text-lg font-bold text-primary-700 dark:text-primary-300">
                  {initial}
                </Text>
              </Pressable>
            </View>
          </View>

          <View
            className="mx-4 mt-5 items-center rounded-3xl bg-white p-6 dark:bg-zinc-900"
            style={ringShadow}
          >
            <CalorieRing consumed={consumed?.calories ?? 0} goal={calorieGoal} />
            <View className="mt-6 w-full">
              <MacroBarRow
                protein={consumed?.protein ?? 0}
                carb={consumed?.carb ?? 0}
                fat={consumed?.fat ?? 0}
                goalProtein={goal?.proteinGoal ?? 0}
                goalCarb={goal?.carbGoal ?? 0}
                goalFat={goal?.fatGoal ?? 0}
              />
            </View>
          </View>

          <CimitAdviceCard
            message={cimitMessage}
            loading={cimitLoading}
            isRoast={isRoast}
            tone={tone}
          />

          <View className="mt-6 px-4">
            <Text className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Makanan hari ini
            </Text>

            <View className="mt-3 gap-3">
              {MEAL_GROUPS.map((group) => {
                const list = grouped.get(group.type) ?? []
                const subtotal = list.reduce((s, m) => s + m.calories, 0)
                return (
                  <View
                    key={group.type}
                    className="rounded-card bg-white px-4 py-3 dark:bg-zinc-900"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base">{group.emoji}</Text>
                        <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {group.label}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <Text
                          className="font-display text-sm font-bold text-zinc-500 dark:text-zinc-400"
                          style={{ fontVariant: ['tabular-nums'] }}
                        >
                          {formatKcal(subtotal)}
                        </Text>
                        <Pressable
                          onPress={() => router.push(`/log?mealType=${group.type}`)}
                          accessibilityRole="button"
                          accessibilityLabel={`Tambah ${group.label}`}
                          className="h-7 w-7 items-center justify-center rounded-full bg-primary-100 active:opacity-70 dark:bg-primary-950"
                        >
                          <Plus size={16} color="#ea580c" strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    </View>
                    {list.length > 0 ? (
                      <View className="mt-1">
                        {list.map((m) => (
                          <MealCard
                            key={m.id}
                            title={m.foodName}
                            subtitle={m.estimatedWeightG ? `${m.estimatedWeightG} g` : undefined}
                            calories={m.calories}
                          />
                        ))}
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => router.push(`/log?mealType=${group.type}`)}
                        className="mt-2 flex-row items-center gap-2 active:opacity-60"
                      >
                        <UtensilsCrossed size={14} color="#a1a1aa" />
                        <Text className="font-sans text-xs text-zinc-400">
                          Belum ada, tap + buat tambah
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}
