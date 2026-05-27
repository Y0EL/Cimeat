import { useRouter } from 'expo-router'
import {
  BookOpen,
  Camera,
  Check,
  MapPin,
  Mic,
  RotateCcw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSubscription } from '~/hooks/use-subscription'
import { useThemeColors } from '~/lib/theme'

type Feature = { icon: typeof Check; label: string }

const PRO_FEATURES: Feature[] = [
  { icon: Camera, label: '50 scan foto / bulan' },
  { icon: Mic, label: '50 log suara / bulan' },
  { icon: BookOpen, label: '20 resep AI / bulan' },
  { icon: MapPin, label: '20 rekomendasi terdekat / bulan' },
  { icon: Sparkles, label: 'AI Coach harian' },
]

const MAX_FEATURES: Feature[] = [
  { icon: Camera, label: 'Scan foto tanpa batas' },
  { icon: Mic, label: 'Log suara tanpa batas' },
  { icon: BookOpen, label: 'Resep AI tanpa batas' },
  { icon: MapPin, label: 'Rekomendasi terdekat tanpa batas' },
  { icon: Sparkles, label: 'AI Coach + analisis mendalam' },
  { icon: Zap, label: 'Akses fitur eksklusif pertama' },
]

export default function PaywallScreen() {
  const c = useThemeColors()
  const router = useRouter()
  const { openPaywall, restorePurchases } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)

  function close() {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/index')
  }

  async function onUpgrade() {
    setLoading(true)
    try {
      await openPaywall()
    } finally {
      setLoading(false)
      close()
    }
  }

  async function onRestore() {
    setRestoring(true)
    try {
      const r = await restorePurchases()
      if (r.ok) close()
    } finally {
      setRestoring(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <Pressable
          onPress={close}
          style={({ pressed }) => ({ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: c.card, opacity: pressed ? 0.7 : 1 })}
        >
          <X size={18} color={c.textSub} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#FF6B35', opacity: 0.12 }} />
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={32} color="#ffffff" />
            </View>
          </View>
          <Text style={{ marginTop: 20, fontFamily: 'Outfit_900Black', fontSize: 30, color: c.text, textAlign: 'center' }}>
            Unlock Cimeat
          </Text>
          <Text style={{ marginTop: 8, fontFamily: 'Outfit_400Regular', fontSize: 15, color: c.textSub, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
            Catat makanan lebih banyak, dapat saran lebih tajam, hidup lebih sehat.
          </Text>
        </View>

        <PlanCard
          name="Pro"
          tagline="Untuk yang serius jaga pola makan"
          features={PRO_FEATURES}
          accent="#FF6B35"
          card={c.card}
          text={c.text}
          textSub={c.textSub}
          border={c.border}
          dark={c.dark}
        />

        <View style={{ height: 12 }} />

        <PlanCard
          name="MAX"
          tagline="Tanpa batas, tanpa kompromi"
          features={MAX_FEATURES}
          accent="#818cf8"
          highlighted
          card={c.card}
          text={c.text}
          textSub={c.textSub}
          border={c.border}
          dark={c.dark}
        />

        <Pressable
          onPress={onUpgrade}
          disabled={loading}
          style={({ pressed }) => ({
            marginTop: 24,
            borderRadius: 99,
            backgroundColor: '#FF6B35',
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed || loading ? 0.8 : 1,
          })}
        >
          {loading ? (
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>
              Membuka...
            </Text>
          ) : (
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>
              Lihat harga & pilih paket
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={onRestore}
          disabled={restoring}
          style={({ pressed }) => ({ marginTop: 14, alignItems: 'center', paddingVertical: 10, opacity: pressed || restoring ? 0.6 : 1 })}
        >
          {restoring ? (
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.textSub }}>
              Memulihkan...
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={14} color={c.textSub} />
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.textSub }}>
                Pulihkan pembelian
              </Text>
            </View>
          )}
        </Pressable>

        <Text style={{ marginTop: 20, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 11, color: c.textFaint, lineHeight: 16 }}>
          Langganan diperbarui otomatis. Batalkan kapan saja lewat Google Play.{'\n'}Harga dalam Rupiah, termasuk pajak.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function PlanCard({
  name,
  tagline,
  features,
  accent,
  highlighted,
  card,
  text,
  textSub,
  border,
  dark,
}: {
  name: string
  tagline: string
  features: Feature[]
  accent: string
  highlighted?: boolean
  card: string
  text: string
  textSub: string
  border: string
  dark: boolean
}) {
  return (
    <View
      style={{
        borderRadius: 28,
        backgroundColor: highlighted ? (dark ? '#1C1F2E' : '#F4F3FF') : card,
        borderWidth: highlighted ? 2 : 1,
        borderColor: highlighted ? accent : border,
        padding: 20,
        overflow: 'hidden',
      }}
    >
      {highlighted ? (
        <View style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: accent, opacity: 0.12 }} pointerEvents="none" />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${accent}22`, alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color={accent} />
          </View>
          <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 20, color: text }}>
            Cimeat {name}
          </Text>
        </View>
        {highlighted ? (
          <View style={{ borderRadius: 99, backgroundColor: accent, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#ffffff' }}>Terbaik</Text>
          </View>
        ) : null}
      </View>

      <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: textSub, marginBottom: 16 }}>
        {tagline}
      </Text>

      <View style={{ gap: 10 }}>
        {features.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: `${accent}20`, alignItems: 'center', justifyContent: 'center' }}>
              <f.icon size={12} color={accent} />
            </View>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: text }}>
              {f.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
