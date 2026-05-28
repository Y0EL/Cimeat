import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQueryClient } from '@tanstack/react-query'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  Apple,
  Camera,
  Check,
  Droplets,
  Mic,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Sunrise,
  Target,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { FoodLogDto, MealType } from '@cimeat/types'
import { formatKcal } from '@cimeat/chat-core'
import { CalorieRing } from '~/components/calorie-ring'
import { CimitAdviceCard } from '~/components/cimit/cimit-advice-card'
import { MacroBarRow } from '~/components/macro-bar'
import { PlanBadge } from '~/components/plan-badge'
import { ScreenFade } from '~/components/screen-fade'
import { useAuth } from '~/hooks/use-auth'
import { useDailyAdvice, useRoast } from '~/hooks/use-cimit'
import { useFoodLogs } from '~/hooks/use-food-logs'
import { useProfile, useDailySummary, todayDate } from '~/hooks/use-summary'
import { useSubscription } from '~/hooks/use-subscription'
import { useThemeColors } from '~/lib/theme'

type MealMeta = { label: string; Icon: typeof Sun; accent: string }

const MEAL_META: Record<MealType, MealMeta> = {
  breakfast: { label: 'Sarapan', Icon: Sunrise, accent: '#f59e0b' },
  lunch: { label: 'Makan Siang', Icon: Sun, accent: '#FF6B35' },
  dinner: { label: 'Makan Malam', Icon: Moon, accent: '#818cf8' },
  snack: { label: 'Camilan', Icon: Apple, accent: '#22C55E' },
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function getStatus(pct: number, neutral: string): { text: string; color: string } {
  if (pct <= 0) return { text: 'Belum ada yang masuk. Yuk isi tenaga lo!', color: neutral }
  if (pct < 33) return { text: 'Awal yang oke! Masih ada ruang buat makan.', color: '#22C55E' }
  if (pct < 66) return { text: 'Setengah jalan, jaga ritmenya bro.', color: '#F59E0B' }
  if (pct < 90) return { text: 'Hampir penuh, pilih makanan lo bijak.', color: '#FF6B35' }
  if (pct <= 100) return { text: 'Mantap, hampir pas target hari ini!', color: '#FF6B35' }
  return { text: 'Lewat target. Gerak dikit yuk biar imbang.', color: '#EF4444' }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function waterKey() {
  const d = new Date()
  return `water_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HomeTab() {
  const c = useThemeColors()
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const profile = useProfile()
  const { plan } = useSubscription()
  const firstName = user?.displayName?.split(' ')[0] ?? 'kamu'
  const initial = (user?.displayName ?? user?.email ?? 'C').charAt(0).toUpperCase()

  const [glasses, setGlasses] = useState(0)

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

  useEffect(() => {
    AsyncStorage.getItem(waterKey()).then((v) => { if (v) setGlasses(Number(v)) }).catch(() => {})
  }, [])

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
      AsyncStorage.getItem(waterKey()).then((v) => { if (v) setGlasses(Number(v)) }).catch(() => {})
    }, [queryClient]),
  )

  const allLogs = logs.data?.pages.flatMap((p) => p.items) ?? []
  const recent = useMemo(
    () => [...allLogs].sort((a, b) => (a.eatenAt < b.eatenAt ? 1 : -1)).slice(0, 4),
    [allLogs],
  )

  const consumed = summary.data?.consumed
  const goal = summary.data?.goal
  const calorieGoal = goal?.calorieGoal ?? 2000
  const consumedCal = consumed?.calories ?? 0
  const remaining = Math.max(0, calorieGoal - consumedCal)
  const pct = calorieGoal > 0 ? (consumedCal / calorieGoal) * 100 : 0
  const status = getStatus(pct, c.textSub)

  const cimitMessage = isRoast ? roast.data?.message : advice.data?.message
  const cimitLoading = isRoast ? roast.isPending : advice.isLoading

  const maybeRoast = useCallback(() => {
    if (isRoast && !roast.data && !roast.isPending) roast.mutate()
  }, [isRoast, roast])
  useFocusEffect(maybeRoast)

  function bumpWater() {
    const next = glasses >= 8 ? 0 : glasses + 1
    setGlasses(next)
    AsyncStorage.setItem(waterKey(), String(next)).catch(() => {})
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScreenFade>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(0).duration(400)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 }}>
            <View>
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub }}>
                {getGreeting()}, {firstName}
              </Text>
              <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: c.orange, marginTop: 2 }}>
                Cimeat
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PlanBadge plan={plan} onPress={() => router.push('/profile')} />
              <Pressable
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="Profil"
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: c.orangeSoft, borderWidth: 2, borderColor: c.orange }}
              >
                <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 17, color: c.orange }}>
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
              backgroundColor: c.card,
              padding: 24,
              alignItems: 'center',
              shadowColor: c.orange,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.14,
              shadowRadius: 24,
              elevation: 6,
            }}
          >
            <CalorieRing consumed={consumedCal} goal={calorieGoal} centerMode="consumed" showSub={false} size={200} />
            <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 18, width: '100%' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: c.textSub }}>Target</Text>
                <Text style={{ marginTop: 3, fontFamily: 'Outfit_900Black', fontSize: 16, color: c.text, fontVariant: ['tabular-nums'] }}>{formatKcal(calorieGoal)}</Text>
              </View>
              <View style={{ width: 1, height: 24, backgroundColor: c.border }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: c.textSub }}>Tersisa</Text>
                <Text style={{ marginTop: 3, fontFamily: 'Outfit_900Black', fontSize: 16, color: c.orange, fontVariant: ['tabular-nums'] }}>{formatKcal(remaining)}</Text>
              </View>
            </View>
            <View style={{ marginTop: 18, width: '100%' }}>
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

          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={{ marginHorizontal: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 14, backgroundColor: status.color + '1A' }}>
            <Text style={{ flex: 1, fontFamily: 'Outfit_700Bold', fontSize: 13, lineHeight: 19, color: status.color }}>
              {status.text}
            </Text>
            <Sparkles size={18} color={status.color} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 14, height: 152 }}>
            <ActionCard
              variant="primary"
              Icon={Camera}
              title="Scan AI"
              subtitle="Foto & deteksi instan"
              onPress={() => router.push('/log')}
            />
            <ActionCard
              variant="secondary"
              Icon={Mic}
              title="Voice Log"
              subtitle="Sebut aja makanan lo"
              onPress={() => router.push('/log')}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <CimitAdviceCard message={cimitMessage} loading={cimitLoading} isRoast={isRoast} tone={tone} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(400)}>
            <WaterTracker glasses={glasses} onBump={bumpWater} />
            <DailyMissions logs={allLogs} glasses={glasses} goal={calorieGoal} consumed={consumedCal} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(280).duration(400)} style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: c.text, marginBottom: 12 }}>
              Baru saja dimakan
            </Text>
            {recent.length > 0 ? (
              <View style={{ gap: 8 }}>
                {recent.map((item) => <RecentItem key={item.id} item={item} />)}
              </View>
            ) : (
              <View style={{ alignItems: 'center', borderRadius: 24, backgroundColor: c.card, paddingVertical: 36, paddingHorizontal: 24 }}>
                <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: c.orangeSoft }}>
                  <UtensilsCrossed size={24} color={c.orange} />
                </View>
                <Text style={{ marginTop: 12, fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.text }}>Belum makan apa-apa</Text>
                <Text style={{ marginTop: 4, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 19, color: c.textSub }}>
                  Tap tombol + di bawah buat catat makanan pertama lo hari ini.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function ActionCard({
  variant,
  Icon,
  title,
  subtitle,
  onPress,
}: {
  variant: 'primary' | 'secondary'
  Icon: typeof Camera
  title: string
  subtitle: string
  onPress: () => void
}) {
  const c = useThemeColors()
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const primary = variant === 'primary'

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 14, stiffness: 400 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 400 }) }}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            borderRadius: 28,
            overflow: 'hidden',
            justifyContent: 'flex-end',
            padding: 20,
            backgroundColor: primary ? '#FF6B35' : c.card,
            borderWidth: primary ? 0 : 1.5,
            borderColor: c.border,
            shadowColor: primary ? '#FF6B35' : c.shadow,
            shadowOffset: { width: 0, height: primary ? 10 : 4 },
            shadowOpacity: primary ? 0.35 : 0.06,
            shadowRadius: primary ? 20 : 14,
            elevation: primary ? 8 : 3,
          },
          style,
        ]}
      >
        <View style={{ position: 'absolute', top: -14, right: -14, opacity: primary ? 0.14 : 0.06 }}>
          <Icon size={120} color={primary ? '#ffffff' : c.orange} />
        </View>
        <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: primary ? 'rgba(255,255,255,0.25)' : c.cardAlt }}>
          <Icon size={20} color={primary ? '#ffffff' : c.orange} />
        </View>
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, lineHeight: 20, color: primary ? '#ffffff' : c.text }}>{title}</Text>
        <Text style={{ marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 16, color: primary ? 'rgba(255,255,255,0.85)' : c.textSub }}>{subtitle}</Text>
      </Animated.View>
    </Pressable>
  )
}

function WaterTracker({ glasses, onBump }: { glasses: number; onBump: () => void }) {
  const c = useThemeColors()
  const fill = useSharedValue(0)

  useEffect(() => {
    fill.value = withTiming(Math.min(glasses / 8, 1) * 100, { duration: 500 })
  }, [glasses, fill])

  const fillStyle = useAnimatedStyle(() => ({ height: `${fill.value}%` }))

  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 28, backgroundColor: c.card, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(14,165,233,0.10)' }, fillStyle]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(14,165,233,0.12)' }}>
            <Droplets size={24} color={c.blue} fill={c.blue} fillOpacity={0.2} />
          </View>
          <View>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: c.textSub }}>Hidrasi</Text>
            <Text style={{ marginTop: 2, fontFamily: 'Outfit_900Black', fontSize: 22, color: c.text }}>
              {glasses}
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub }}> / 8 gelas</Text>
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onBump}
          accessibilityLabel="Tambah air"
          style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(14,165,233,0.12)', opacity: pressed ? 0.7 : 1 })}
        >
          <Plus size={22} color={c.blue} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  )
}

type Mission = {
  id: string
  label: string
  sub: string
  Icon: typeof Droplets
  tint: string
  progress: (logs: FoodLogDto[], glasses: number, goal: number, consumed: number) => number
}

const MISSIONS: Mission[] = [
  { id: 'water', label: 'Air minum', sub: '8 gelas sehari', Icon: Droplets, tint: '#0ea5e9', progress: (_l, g) => Math.min(g / 8, 1) },
  { id: 'meals', label: 'Catat makan', sub: '3 kali hari ini', Icon: Camera, tint: '#FF6B35', progress: (l) => Math.min(l.length / 3, 1) },
  { id: 'target', label: 'Jaga target', sub: 'di bawah goal', Icon: Target, tint: '#22C55E', progress: (_l, _g, goal, consumed) => (goal > 0 && consumed > 0 && consumed <= goal ? 1 : 0) },
  { id: 'scan', label: 'Scan AI', sub: '1 foto makanan', Icon: Sparkles, tint: '#818cf8', progress: (l) => (l.some((x) => x.source === 'vision') ? 1 : 0) },
]

function DailyMissions({
  logs,
  glasses,
  goal,
  consumed,
}: {
  logs: FoodLogDto[]
  glasses: number
  goal: number
  consumed: number
}) {
  const c = useThemeColors()
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: c.text, marginBottom: 12 }}>Misi hari ini</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {MISSIONS.map((m) => {
          const p = m.progress(logs, glasses, goal, consumed)
          const done = p >= 1
          return (
            <View
              key={m.id}
              style={{ flexGrow: 1, flexBasis: '46%', borderRadius: 24, backgroundColor: c.card, borderWidth: 1.5, borderColor: done ? m.tint : c.border, padding: 14, gap: 10 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: m.tint + '1F' }}>
                  <m.Icon size={16} color={m.tint} />
                </View>
                {done ? (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: m.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} color="#ffffff" strokeWidth={3} />
                  </View>
                ) : null}
              </View>
              <View>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: c.text }}>{m.label}</Text>
                <Text style={{ marginTop: 1, fontFamily: 'Outfit_400Regular', fontSize: 11, color: c.textSub }}>{m.sub}</Text>
              </View>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${Math.round(p * 100)}%`, backgroundColor: m.tint, borderRadius: 3 }} />
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function RecentItem({ item }: { item: FoodLogDto }) {
  const c = useThemeColors()
  const meta = item.mealType ? MEAL_META[item.mealType] : null
  const Icon = meta?.Icon ?? Utensils
  const accent = meta?.accent ?? c.textSub

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, backgroundColor: c.card, paddingHorizontal: 14, paddingVertical: 12, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <View style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '1F' }}>
        <Icon size={20} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.text }}>{item.foodName}</Text>
        <Text style={{ marginTop: 2, fontFamily: 'Outfit_400Regular', fontSize: 12, color: c.textSub }}>
          {meta?.label ?? 'Lainnya'}{item.eatenAt ? ` · ${formatTime(item.eatenAt)}` : ''}
        </Text>
      </View>
      <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 15, color: c.orange, fontVariant: ['tabular-nums'] }}>{formatKcal(item.calories)}</Text>
    </View>
  )
}
