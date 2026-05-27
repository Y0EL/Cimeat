import { useRef, useMemo, useState } from 'react'
import { Platform, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import ViewShot, { type ViewShotRef } from 'react-native-view-shot'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Flame, Share2, Sparkles, TrendingUp } from 'lucide-react-native'
import { formatKcal } from '@cimeat/chat-core'
import { DonutChart } from '~/components/donut-chart'
import { LineChart } from '~/components/line-chart'
import { ScreenFade } from '~/components/screen-fade'
import { useAuth } from '~/hooks/use-auth'
import { useGoals } from '~/hooks/use-goals'
import { useFlexTrend, type TrendPeriod } from '~/hooks/use-trend'
import { MACRO_COLORS } from '~/lib/categories'
import { useThemeColors } from '~/lib/theme'

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

export default function ProgressTab() {
  const c = useThemeColors()
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  const [period, setPeriod] = useState<TrendPeriod>('daily')
  const goals = useGoals()
  const { from, to } = useMemo(() => rangeFor(period), [period])
  const trend = useFlexTrend(period, from, to)
  const shareRef = useRef<ViewShotRef>(null)

  const data = trend.data ?? []
  const withData = data.filter((d) => d.calories > 0)
  const avgCalories =
    withData.length > 0 ? withData.reduce((s, d) => s + d.calories, 0) / withData.length : 0
  const goalCal = goals.data?.calorieGoal ?? 0
  const onTarget =
    goalCal > 0
      ? withData.filter((d) => Math.abs(d.calories - goalCal) <= goalCal * 0.1).length
      : 0

  const streak = useMemo(() => {
    let s = 0
    for (let i = data.length - 1; i >= 0; i--) {
      if ((data[i]?.calories ?? 0) > 0) s++
      else break
    }
    return s
  }, [data])

  const totalProtein = data.reduce((s, d) => s + d.protein, 0)
  const totalCarb = data.reduce((s, d) => s + d.carb, 0)
  const totalFat = data.reduce((s, d) => s + d.fat, 0)
  const macroSlices = [
    { name: 'Protein', total: totalProtein * 4, color: MACRO_COLORS.protein },
    { name: 'Karbo', total: totalCarb * 4, color: MACRO_COLORS.carb },
    { name: 'Lemak', total: totalFat * 9, color: MACRO_COLORS.fat },
  ]

  const chartWidth = width - 56

  async function onShare() {
    try {
      const uri = await shareRef.current?.capture?.()
      if (!uri) return
      await Share.share(Platform.OS === 'ios' ? { url: uri } : { message: uri })
    } catch {}
  }

  const firstName = user?.displayName?.split(' ')[0] ?? 'kamu'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScreenFade>
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub }}>Statistik</Text>
          <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: c.text, marginTop: 2 }}>
            Progres lo
          </Text>
        </Animated.View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 16 }}>
          <Animated.View entering={FadeInDown.delay(40).duration(400)}>
            <View style={{ flexDirection: 'row', gap: 4, borderRadius: 99, backgroundColor: c.card, padding: 4 }}>
              {PERIODS.map((p) => {
                const active = period === p.key
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPeriod(p.key)}
                    style={{ flex: 1, alignItems: 'center', borderRadius: 99, paddingVertical: 10, backgroundColor: active ? '#FF6B35' : 'transparent' }}
                  >
                    <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 13, color: active ? '#ffffff' : c.textSub }}>
                      {p.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <StatCard label="Rata-rata" value={formatKcal(avgCalories)} />
            <StatCard label="On-target" value={`${onTarget}x`} />
            <StatCard label="Streak" value={streak} />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(120).duration(400)}
            style={{
              marginTop: 14,
              borderRadius: 32,
              backgroundColor: '#2A2D30',
              padding: 20,
              overflow: 'hidden',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <View style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: '#FF6B35', opacity: 0.12 }} pointerEvents="none" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#ffffff' }}>AI Coach</Text>
                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A8886', marginTop: 1 }}>Analisis progres lo</Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 22, color: '#F8F7F4' }}>
              {streak >= 7
                ? `Streak ${streak} hari! Lo konsisten banget. Pertahankan pola ini buat hasil optimal.`
                : avgCalories > 0
                ? `Rata-rata kalori lo ${formatKcal(avgCalories)} / hari. ${goalCal > 0 && avgCalories <= goalCal ? 'Bagus, lo on-track!' : 'Coba lebih dekat ke target lo.'}`
                : 'Mulai catat makanan lo biar AI Coach bisa kasih analisis yang lebih personal.'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <Flame size={16} color="#FF6B35" />
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#FF6B35' }}>
                {streak} hari streak
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(160).duration(400)}
            style={{ marginTop: 14, borderRadius: 24, backgroundColor: c.card, padding: 16, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
          >
            <Text style={{ marginBottom: 12, fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.text }}>
              Tren kalori
            </Text>
            {data.length > 0 ? (
              <LineChart data={data} width={chartWidth} period={period} />
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <TrendingUp size={32} color={c.textFaint} />
                <Text style={{ marginTop: 8, fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.textSub }}>Belum ada data</Text>
              </View>
            )}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={{ marginTop: 14, borderRadius: 24, backgroundColor: c.card, padding: 16, alignItems: 'center', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
          >
            <Text style={{ marginBottom: 12, alignSelf: 'flex-start', fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.text }}>
              Sebaran makro (kalori)
            </Text>
            <DonutChart slices={macroSlices} centerLabel="Periode" centerValue={`${data.length}`} />
            <View style={{ marginTop: 12, flexDirection: 'row', gap: 16 }}>
              <Legend color={MACRO_COLORS.protein} label="Protein" />
              <Legend color={MACRO_COLORS.carb} label="Karbo" />
              <Legend color={MACRO_COLORS.fat} label="Lemak" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginTop: 14 }}>
            <ViewShot ref={shareRef} options={{ format: 'png', quality: 0.95 }}>
              <View
                style={{
                  borderRadius: 28,
                  backgroundColor: '#FF6B35',
                  padding: 24,
                  overflow: 'hidden',
                }}
              >
                <View style={{ position: 'absolute', bottom: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' }} pointerEvents="none" />
                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Pencapaian minggu ini</Text>
                <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: '#ffffff', marginTop: 4 }}>{firstName}</Text>
                <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
                  <View>
                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Streak</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ffffff' }}>{streak}</Text>
                      <Flame size={16} color="rgba(255,255,255,0.9)" />
                    </View>
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Rata-rata</Text>
                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ffffff' }}>{formatKcal(avgCalories)}</Text>
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>On-target</Text>
                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ffffff' }}>{onTarget}x</Text>
                  </View>
                </View>
                <Text style={{ marginTop: 16, fontFamily: 'Outfit_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Cimeat · cimeat.app</Text>
              </View>
            </ViewShot>
            <Pressable
              onPress={onShare}
              style={({ pressed }) => ({
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 20,
                backgroundColor: c.card,
                paddingVertical: 14,
                opacity: pressed ? 0.8 : 1,
                borderWidth: 1.5,
                borderColor: c.dark ? '#FF6B3550' : '#FF6B3530',
              })}
            >
              <Share2 size={16} color="#FF6B35" />
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#FF6B35' }}>Bagikan Pencapaian</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  const c = useThemeColors()
  return (
    <View style={{ flex: 1, borderRadius: 20, backgroundColor: c.card, padding: 14, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: c.textSub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, color: '#FF6B35' }}>
          {value}
        </Text>
        {label === 'Streak' ? <Flame size={14} color="#FF6B35" /> : null}
      </View>
    </View>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  const c = useThemeColors()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: c.textSub }}>{label}</Text>
    </View>
  )
}
