import { useState } from 'react'
import { Banknote, MapPin, Navigation, Salad, Scale, Sparkles, Utensils } from 'lucide-react-native'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { EatingMode, NearbyResponse } from '@cimeat/types'
import { TtsButton } from '~/components/cimit/tts-button'
import { QuotaBadge } from '~/components/quota-badge'
import { ScreenFade } from '~/components/screen-fade'
import { useNearbyRecommend } from '~/hooks/use-nearby'
import { useSubscription } from '~/hooks/use-subscription'
import { apiErrorMessage, isQuotaExceeded } from '~/lib/api'
import { track } from '~/lib/analytics'
import { getCurrentCoords } from '~/lib/location'
import { useThemeColors } from '~/lib/theme'

type ModeItem = { key: EatingMode; label: string; Icon: typeof Banknote; color: string }

const MODES: ModeItem[] = [
  { key: 'hemat', label: 'Hemat', Icon: Banknote, color: '#f59e0b' },
  { key: 'sehat', label: 'Sehat', Icon: Salad, color: '#22C55E' },
  { key: 'balanced', label: 'Seimbang', Icon: Scale, color: '#818cf8' },
]

export default function NearbyTab() {
  const c = useThemeColors()
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScreenFade>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 4, paddingTop: 12 }}>
          <View>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub }}>Cari warung</Text>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: c.text }}>
              Makan di sekitar
            </Text>
          </View>
          <QuotaBadge feature="nearby" />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
          <Text style={{ marginBottom: 8, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
            Mode
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {MODES.map((m) => {
              const active = mode === m.key
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    borderRadius: 20,
                    backgroundColor: active ? m.color : c.card,
                    paddingVertical: 14,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: active ? 'rgba(255,255,255,0.2)' : c.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <m.Icon size={18} color={active ? '#ffffff' : c.textSub} />
                  </View>
                  <Text style={{ marginTop: 6, fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : c.textSub }}>
                    {m.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Pressable
            onPress={find}
            disabled={busy}
            style={({ pressed }) => ({
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 99,
              backgroundColor: c.orange,
              paddingVertical: 14,
              opacity: pressed || busy ? 0.7 : 1,
            })}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Navigation size={18} color="#fff" />
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>
                  Cari makanan di sekitar
                </Text>
              </>
            )}
          </Pressable>

          {!result && !busy ? (
            <View style={{ marginTop: 32, alignItems: 'center' }}>
              <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 36, backgroundColor: c.orangeSoft }}>
                <MapPin size={30} color={c.orange} />
              </View>
              <Text style={{ marginTop: 16, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 22, color: c.textSub }}>
                Pilih mode terus tap tombol di atas. Cimit bakal saranin makanan terdekat yang cocok.
              </Text>
            </View>
          ) : null}

          {result ? (
            <View style={{ marginTop: 20 }}>
              <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 24, backgroundColor: '#2A2D30', paddingHorizontal: 16, paddingVertical: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="#ffffff" />
                </View>
                <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 22, color: '#F8F7F4' }}>
                  {result.cimit_message}
                </Text>
                <TtsButton text={result.cimit_message} size={16} />
              </View>

              <View style={{ gap: 10 }}>
                {result.items.map((item, i) => (
                  <View key={`${item.name}-${i}`} style={{ borderRadius: 24, backgroundColor: c.card, padding: 16, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.text }}>
                          {item.name}
                        </Text>
                        <Text style={{ marginTop: 2, fontFamily: 'Outfit_400Regular', fontSize: 12, color: c.textSub }}>
                          {item.food_type} · {item.distance_m} m
                        </Text>
                      </View>
                      <View style={{ borderRadius: 12, backgroundColor: c.orangeSoft, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: c.orange }}>
                          ~{item.estimated_calories} kkal
                        </Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Utensils size={13} color={c.orange} />
                      <Text style={{ flex: 1, fontFamily: 'Outfit_700Bold', fontSize: 12, color: c.text }}>
                        Pesan: {item.suggested_order}
                      </Text>
                    </View>
                    <Text style={{ marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: c.textSub }}>
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
