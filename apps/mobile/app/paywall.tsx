import { useRouter } from 'expo-router'
import { Check, Sparkles, X } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSubscription } from '~/hooks/use-subscription'
import {
  getCurrentOffering,
  pickPackage,
  purchasePackage,
  restorePurchases,
} from '~/lib/revenuecat'

const FEATURES = [
  { title: 'Scan makanan unlimited', desc: 'Foto, langsung kehitung kalorinya' },
  { title: 'Coach tanpa batas', desc: 'Tanya AI Diet Coach sepuasnya' },
  { title: 'Analitik lengkap', desc: 'Tren kalori & makro detail' },
  { title: 'Resep kalkulator', desc: 'Hitung kalori resep apa aja' },
  { title: 'Makanan custom', desc: 'Simpan favorit gak terbatas' },
  { title: 'Akses fitur duluan', desc: 'Coba fitur Pro lebih awal' },
]

export default function PaywallScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { isPro } = useSubscription()
  const [buying, setBuying] = useState(false)
  const [restoring, setRestoring] = useState(false)

  async function onBuy() {
    if (buying) return
    setBuying(true)
    try {
      const offering = await getCurrentOffering()
      const pkg = pickPackage(offering, 'monthly')
      if (!pkg) {
        Alert.alert('Belum tersedia', 'Pembelian belum tersedia di perangkat ini.')
        return
      }
      const result = await purchasePackage(pkg)
      if (result.ok) {
        router.back()
      } else if (!result.userCancelled) {
        Alert.alert('Gagal', result.message)
      }
    } finally {
      setBuying(false)
    }
  }

  async function onRestore() {
    if (restoring) return
    setRestoring(true)
    try {
      const result = await restorePurchases()
      if (result.ok) {
        Alert.alert('Berhasil', 'Akses Pro lo udah dipulihkan.', [
          { text: 'Lanjut', onPress: () => router.back() },
        ])
      } else {
        Alert.alert('Tidak ditemukan', 'Gak ada pembelian yang bisa dipulihkan.')
      }
    } finally {
      setRestoring(false)
    }
  }

  if (isPro) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-cream px-6 dark:bg-zinc-950"
        edges={['top', 'bottom']}
      >
        <View className="items-center gap-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
            <Sparkles size={40} color="#ea580c" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-center font-display text-2xl font-bold text-zinc-950 dark:text-white">
              Lo udah Pro!
            </Text>
            <Text className="text-center font-sans text-sm leading-5 text-zinc-500">
              Semua fitur premium udah aktif di akun lo.
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="rounded-full bg-primary-600 px-8 py-3.5 active:opacity-90"
          >
            <Text className="font-sans text-base font-semibold text-white">Kembali</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const featurePairs: (typeof FEATURES)[] = []
  for (let i = 0; i < FEATURES.length; i += 2) {
    featurePairs.push(FEATURES.slice(i, i + 2))
  }

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top', 'bottom']}>
      <View className="flex-row justify-end px-4 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 active:opacity-70 dark:bg-zinc-800"
          accessibilityLabel="Tutup"
        >
          <X size={16} color={isDark ? '#a1a1aa' : '#71717a'} />
        </Pressable>
      </View>

      <View className="flex-1 justify-center gap-6 px-6 pb-4">
        <View className="items-center gap-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
            <Sparkles size={36} color="#ea580c" />
          </View>
          <Text className="font-display text-2xl font-bold text-zinc-950 dark:text-white">
            Cimeat Pro
          </Text>
          <Text className="text-center font-sans text-sm text-zinc-500">
            Lacak kalori tanpa batas, lebih pinter.
          </Text>
        </View>

        <View className="gap-3">
          {featurePairs.map((pair, i) => (
            <View key={i} className="flex-row gap-3">
              {pair.map((f) => (
                <View key={f.title} className="flex-1 flex-row items-start gap-2">
                  <View className="mt-0.5 h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-600">
                    <Check size={9} color="#ffffff" strokeWidth={3} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {f.title}
                    </Text>
                    <Text className="mt-0.5 font-sans text-xs text-zinc-500">{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View className="gap-2.5">
          <View className="flex-row items-center justify-between rounded-2xl border border-primary-200 bg-primary-50 px-5 py-4 dark:border-primary-800 dark:bg-primary-950">
            <View>
              <Text className="font-sans text-xs text-zinc-500">per bulan</Text>
              <Text className="mt-0.5 font-sans text-xs text-zinc-400 dark:text-zinc-600">
                Batalkan kapan aja
              </Text>
            </View>
            <Text className="font-display text-3xl font-bold text-zinc-950 dark:text-white">
              Rp 39.000
            </Text>
          </View>

          <Pressable
            onPress={onBuy}
            disabled={buying}
            className="w-full items-center justify-center rounded-full bg-primary-600 py-4 active:opacity-90 disabled:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Berlangganan Cimeat Pro"
          >
            {buying ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-sans text-base font-semibold text-white">Mulai Sekarang</Text>
            )}
          </Pressable>

          <View className="flex-row items-center justify-center gap-4">
            <Pressable
              onPress={onRestore}
              disabled={restoring}
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel="Pulihkan pembelian"
            >
              {restoring ? (
                <ActivityIndicator size="small" color="#71717a" />
              ) : (
                <Text className="font-sans text-xs text-zinc-500">Pulihkan pembelian</Text>
              )}
            </Pressable>
            <Text className="font-sans text-xs text-zinc-300 dark:text-zinc-700">·</Text>
            <Text className="font-sans text-xs text-zinc-500">Syarat berlaku</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
