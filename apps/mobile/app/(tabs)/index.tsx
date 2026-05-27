import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQueryClient } from '@tanstack/react-query'
import { useFocusEffect, useRouter } from 'expo-router'
import { Camera, CheckCircle2, Droplets, Flame, Mic, Plus, Sparkles, UtensilsCrossed } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
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
import { useProfile, useDailySummary, todayDate } from '~/hooks/use-summary'
import { useSubscription } from '~/hooks/use-subscription'

const MEAL_GROUPS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Sarapan', emoji: '🍳' },
  { type: 'lunch', label: 'Makan Siang', emoji: '🍱' },
  { type: 'dinner', label: 'Makan Malam', emoji: '🍲' },
  { type: 'snack', label: 'Camilan', emoji: '🍪' },
]

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function waterKey() {
  const d = new Date()
  return `water_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function WaterTracker() {
  const [glasses, setGlasses] = useState(0)

  useEffect(() => {
    AsyncStorage.getItem(waterKey()).then((v) => {
      if (v) setGlasses(Number(v))
    }).catch(() => {})
  }, [])

  const toggle = (i: number) => {
    const next = i < glasses ? i : i + 1
    setGlasses(next)
    AsyncStorage.setItem(waterKey(), String(next)).catch(() => {})
  }

  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 16, shadowColor: '#1A1C1E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Droplets size={18} color="#0ea5e9" />
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#1A1C1E' }}>Air minum</Text>
        </View>
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#0ea5e9' }}>{glasses}/8 gelas</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Pressable
            key={i}
            onPress={() => toggle(i)}
            style={({ pressed }) => ({
              flex: 1,
              height: 36,
              borderRadius: 10,
              backgroundColor: i < glasses ? '#0ea5e9' : '#F0EEE9',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Droplets size={14} color={i < glasses ? '#ffffff' : '#D0CEC9'} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

type Mission = { id: string; label: string; emoji: string; isDone: (logs: FoodLogDto[], glasses: number, goal: number) => boolean }

const MISSIONS: Mission[] = [
  { id: 'log3', label: 'Catat 3 makanan', emoji: '📝', isDone: (logs) => logs.length >= 3 },
  { id: 'water8', label: 'Minum 8 gelas', emoji: '💧', isDone: (_, g) => g >= 8 },
  { id: 'ontrack', label: 'Tetap di target', emoji: '🎯', isDone: (logs, _, goal) => { const tot = logs.reduce((s, l) => s + l.calories, 0); return goal > 0 && tot <= goal } },
  { id: 'scan1', label: 'Scan 1 makanan', emoji: '📸', isDone: (logs) => logs.some((l) => l.source === 'vision') },
]

function DailyMissions({ logs, glasses, goal }: { logs: FoodLogDto[]; glasses: number; goal: number }) {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#1A1C1E', marginBottom: 10 }}>Misi hari ini</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {MISSIONS.map((m) => {
          const done = m.isDone(logs, glasses, goal)
          return (
            <View
              key={m.id}
              style={{
                flex: 1,
                minWidth: '45%',
                borderRadius: 20,
                backgroundColor: done ? '#FFF3EE' : '#FFFFFF',
                borderWidth: done ? 1.5 : 1,
                borderColor: done ? '#FF6B35' : '#F0EEE9',
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
              <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 13, color: done ? '#FF6B35' : '#1A1C1E', lineHeight: 18 }}>{m.label}</Text>
              {done ? <CheckCircle2 size={16} color="#FF6B35" /> : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default function HomeTab() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const profile = useProfile()
  const { plan } = useSubscription()
  const firstName = user?.displayName?.split(' ')[0] ?? 'kamu'
  const initial = (user?.displayName ?? user?.email ?? 'C').charAt(0).toUpperCase()
  const [glasses, setGlassesState] = useState(0)

  useEffect(() => {
    AsyncStorage.getItem(waterKey()).then((v) => { if (v) setGlassesState(Number(v)) }).catch(() => {})
  }, [])

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
      AsyncStorage.getItem(waterKey()).then((v) => { if (v) setGlassesState(Number(v)) }).catch(() => {})
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7F4' }} edges={['top']}>
      <ScreenFade>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(0).duration(400)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 }}>
            <View>
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A8886' }}>
                {getGreeting()}, {firstName} 👋
              </Text>
              <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: '#FF6B35', marginTop: 2 }}>
                Cimeat
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PlanBadge plan={plan} onPress={() => router.push('/profile')} />
              <Pressable
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="Profil"
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#FFF3EE', borderWidth: 2, borderColor: '#FF6B35' }}
              >
                <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 17, color: '#FF6B35' }}>
                  {initial}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(80).duration(400)}
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              borderRadius: 32,
              backgroundColor: '#FFFFFF',
              padding: 24,
              alignItems: 'center',
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.14,
              shadowRadius: 24,
              elevation: 6,
            }}
          >
            <CalorieRing consumed={consumed?.calories ?? 0} goal={calorieGoal} />
            <View style={{ marginTop: 20, width: '100%' }}>
              <MacroBarRow
                protein={consumed?.protein ?? 0}
                carb={consumed?.carb ?? 0}
                fat={consumed?.fat ?? 0}
                goalProtein={goal?.proteinGoal ?? 0}
                goalCarb={goal?.carbGoal ?? 0}
                goalFat={goal?.fatGoal ?? 0}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(400)}>
            <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 16 }}>
              <Pressable
                onPress={() => router.push('/log?tab=foto')}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 20,
                  backgroundColor: '#FF6B35',
                  paddingVertical: 14,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Camera size={18} color="#ffffff" />
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>Scan Makanan</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/log?tab=suara')}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 14,
                  opacity: pressed ? 0.8 : 1,
                  borderWidth: 1.5,
                  borderColor: '#FF6B3530',
                })}
              >
                <Mic size={18} color="#FF6B35" />
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#FF6B35' }}>Catat Suara</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(400)}>
            <CimitAdviceCard
              message={cimitMessage}
              loading={cimitLoading}
              isRoast={isRoast}
              tone={tone}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(400)}>
            <WaterTracker />
            <DailyMissions logs={allLogs} glasses={glasses} goal={calorieGoal} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1A1C1E', marginBottom: 12 }}>
              Makanan hari ini
            </Text>

            <View style={{ gap: 10 }}>
              {MEAL_GROUPS.map((group) => {
                const list = grouped.get(group.type) ?? []
                const subtotal = list.reduce((s, m) => s + m.calories, 0)
                return (
                  <View
                    key={group.type}
                    style={{ borderRadius: 24, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, shadowColor: '#1A1C1E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 18 }}>{group.emoji}</Text>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#1A1C1E' }}>
                          {group.label}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#8A8886' }}>
                          {formatKcal(subtotal)}
                        </Text>
                        <Pressable
                          onPress={() => router.push(`/log?mealType=${group.type}`)}
                          accessibilityRole="button"
                          accessibilityLabel={`Tambah ${group.label}`}
                          style={({ pressed }) => ({ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFF3EE', opacity: pressed ? 0.7 : 1 })}
                        >
                          <Plus size={16} color="#FF6B35" strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    </View>
                    {list.length > 0 ? (
                      <View style={{ marginTop: 4 }}>
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
                        style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      >
                        <UtensilsCrossed size={13} color="#D0CEC9" />
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#D0CEC9' }}>
                          Belum ada, tap + buat tambah
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}
