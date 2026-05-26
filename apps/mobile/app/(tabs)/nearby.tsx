import { useState } from 'react'
import { MapPin, Navigation, Utensils } from 'lucide-react-native'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { EatingMode, NearbyResponse } from '@cimeat/types'
import { CimitMascot } from '~/components/cimit/cimit-mascot'
import { TtsButton } from '~/components/cimit/tts-button'
import { QuotaBadge } from '~/components/quota-badge'
import { ScreenFade } from '~/components/screen-fade'
import { useNearbyRecommend } from '~/hooks/use-nearby'
import { useSubscription } from '~/hooks/use-subscription'
import { apiErrorMessage, isQuotaExceeded } from '~/lib/api'
import { track } from '~/lib/analytics'
import { getCurrentCoords } from '~/lib/location'
import { useAccentColor } from '~/lib/use-accent-color'

const MODES: { key: EatingMode; label: string; emoji: string }[] = [
  { key: 'hemat', label: 'Hemat', emoji: '💸' },
  { key: 'sehat', label: 'Sehat', emoji: '🥗' },
  { key: 'balanced', label: 'Seimbang', emoji: '⚖️' },
]

export default function NearbyTab() {
  const accent = useAccentColor()
  const recommend = useNearbyRecommend()
  const { openPaywall } = useSubscription()
  const [mode, setMode] = useState<EatingMode>('balanced')
  const [result, setResult] = useState<NearbyResponse | null>(null)
  const [locating, setLocating] = useState(false)

  async function find() {
    setLocating(true)
    try {
      const loc = await getCurrentCoords()
      if (!loc.ok) {
        Alert.alert(
          loc.reason === 'denied' ? 'Izin lokasi' : 'Gagal lokasi',
          loc.reason === 'denied'
            ? 'Cimeat butuh akses lokasi buat cari makanan di sekitar lo.'
            : 'Gagal ambil lokasi, coba lagi ya.',
        )
        return
      }
      track('nearby_recommend', { mode })
      const r = await recommend.mutateAsync({ lat: loc.coords.lat, lng: loc.coords.lng, mode })
      setResult(r)
    } catch (err) {
      if (isQuotaExceeded(err)) {
        track('quota_blocked')
        Alert.alert('Jatah abis', 'Upgrade buat rekomendasi lebih banyak.', [
          { text: 'Nanti', style: 'cancel' },
          { text: 'Upgrade', onPress: () => void openPaywall() },
        ])
        return
      }
      Alert.alert('Gagal', apiErrorMessage(err))
    } finally {
      setLocating(false)
    }
  }

  const busy = locating || recommend.isPending

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-row items-center justify-between px-4 pb-1 pt-2">
          <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Makan di sekitar
          </Text>
          <QuotaBadge feature="nearby" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-32 pt-3" showsVerticalScrollIndicator={false}>
          <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Mode
          </Text>
          <View className="flex-row gap-2">
            {MODES.map((m) => {
              const active = mode === m.key
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  className={
                    active
                      ? 'flex-1 items-center rounded-2xl bg-primary-600 py-3'
                      : 'flex-1 items-center rounded-2xl bg-white py-3 dark:bg-zinc-900'
                  }
                >
                  <Text className="text-lg">{m.emoji}</Text>
                  <Text
                    className={
                      active
                        ? 'mt-1 font-sans text-xs font-semibold text-white'
                        : 'mt-1 font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                    }
                  >
                    {m.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Pressable
            onPress={find}
            disabled={busy}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Navigation size={18} color="#fff" />
                <Text className="font-sans text-sm font-semibold text-white">
                  Cari makanan di sekitar
                </Text>
              </>
            )}
          </Pressable>

          {!result && !busy ? (
            <View className="mt-8 items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
                <MapPin size={28} color={accent} />
              </View>
              <Text className="mt-4 text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                Pilih mode terus tap tombol di atas. Cimit bakal saranin makanan terdekat yang
                cocok.
              </Text>
            </View>
          ) : null}

          {result ? (
            <View className="mt-5">
              <View className="mb-3 flex-row items-start gap-2 rounded-2xl bg-primary-50 px-3 py-2.5 dark:bg-primary-950">
                <CimitMascot size={36} />
                <Text className="flex-1 font-sans text-sm leading-5 text-zinc-700 dark:text-zinc-200">
                  {result.cimit_message}
                </Text>
                <TtsButton text={result.cimit_message} size={16} />
              </View>

              <View className="gap-2">
                {result.items.map((item, i) => (
                  <View key={`${item.name}-${i}`} className="rounded-card bg-white p-4 dark:bg-zinc-900">
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </Text>
                        <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
                          {item.food_type} · {item.distance_m} m
                        </Text>
                      </View>
                      <Text className="font-display text-sm font-bold text-primary-600 dark:text-primary-300">
                        ~{item.estimated_calories} kkal
                      </Text>
                    </View>
                    <View className="mt-2 flex-row items-center gap-1.5">
                      <Utensils size={13} color={accent} />
                      <Text className="flex-1 font-sans text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        Pesan: {item.suggested_order}
                      </Text>
                    </View>
                    <Text className="mt-1 font-sans text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                      {item.reason}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}
