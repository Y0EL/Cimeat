import { useQueryClient } from '@tanstack/react-query'
import { useFocusEffect, useRouter } from 'expo-router'
import { Camera, ChartLine, Plus, UtensilsCrossed } from 'lucide-react-native'
import { useCallback, useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { MealType } from '@cimeat/types'
import { formatKcal } from '@cimeat/chat-core'
import { CalorieRing } from '~/components/calorie-ring'
import { MacroBarRow } from '~/components/macro-bar'
import { MealCard } from '~/components/meal-card'
import { ScreenFade } from '~/components/screen-fade'
import { useAuth } from '~/hooks/use-auth'
import { useMeals } from '~/hooks/use-meals'
import { useDailySummary, todayDate } from '~/hooks/use-summary'
import { useAccentColor } from '~/lib/use-accent-color'

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
  const accent = useAccentColor()
  const queryClient = useQueryClient()
  const firstName = user?.displayName?.split(' ')[0] ?? 'kamu'

  const today = todayDate()
  const summary = useDailySummary(today)
  const start = `${today}T00:00:00.000Z`
  const end = `${today}T23:59:59.999Z`
  const meals = useMeals({ from: start, to: end })

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['meals'] })
    }, [queryClient]),
  )

  const allMeals = meals.data?.pages.flatMap((p) => p.items) ?? []
  const grouped = useMemo(() => {
    const map = new Map<MealType, typeof allMeals>()
    for (const m of allMeals) {
      const list = map.get(m.mealType) ?? []
      list.push(m)
      map.set(m.mealType, list)
    }
    return map
  }, [allMeals])

  const consumed = summary.data?.consumed
  const goal = summary.data?.goal
  const calorieGoal = goal?.calorieGoal ?? 2000

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
            <Pressable
              onPress={() => router.push('/analytics')}
              accessibilityRole="button"
              accessibilityLabel="Lihat analitik"
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-100 active:opacity-70 dark:bg-primary-950"
            >
              <ChartLine size={20} color={accent} />
            </Pressable>
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

          <View className="mx-4 mt-4 flex-row gap-3">
            <QuickAction
              icon={<Camera size={20} color={accent} />}
              label="Foto makanan"
              onPress={() => router.push('/add-modal?tab=scan')}
            />
            <QuickAction
              icon={<Plus size={20} color={accent} />}
              label="Catat manual"
              onPress={() => router.push('/add-modal')}
            />
          </View>

          <View className="mt-8 px-4">
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
                          onPress={() => router.push(`/add-modal?mealType=${group.type}`)}
                          accessibilityRole="button"
                          accessibilityLabel={`Tambah ${group.label}`}
                          className="h-7 w-7 items-center justify-center rounded-full bg-primary-100 active:opacity-70 dark:bg-primary-950"
                        >
                          <Plus size={16} color={accent} strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    </View>
                    {list.length > 0 ? (
                      <View className="mt-1">
                        {list.map((m) => (
                          <MealCard
                            key={m.id}
                            title={m.name}
                            subtitle={m.servings !== 1 ? `${m.servings} porsi` : undefined}
                            calories={m.calories}
                          />
                        ))}
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => router.push(`/add-modal?mealType=${group.type}`)}
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

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 flex-row items-center gap-2 rounded-card bg-white px-4 py-3.5 active:opacity-80 dark:bg-zinc-900"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950">
        {icon}
      </View>
      <Text className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {label}
      </Text>
    </Pressable>
  )
}
