import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Globe,
  Heart,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  Target,
} from 'lucide-react-native'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CimitTone, CimitVoice, EatingMode } from '@cimeat/types'
import { CimitMascot } from '~/components/cimit/cimit-mascot'
import { PlanBadge } from '~/components/plan-badge'
import { ScreenFade } from '~/components/screen-fade'
import { useAuth } from '~/hooks/use-auth'
import { useProfile, useUpdateProfile } from '~/hooks/use-summary'
import { useSubscription } from '~/hooks/use-subscription'
import { signOutUser } from '~/lib/auth'
import { apiErrorMessage } from '~/lib/api'
import { getCimitVoice, setCimitVoice } from '~/lib/cimit-voice'
import { useLang, type Lang } from '~/lib/lang-context'
import { useTheme, type ThemePref } from '~/lib/theme'

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'en', label: 'EN' },
  { key: 'zh', label: '中' },
]

const TONES: { key: CimitTone; label: string; hint: string }[] = [
  { key: 'soft', label: 'Lembut', hint: 'Sabar & nyemangatin' },
  { key: 'normal', label: 'Normal', hint: 'Santai tapi jujur' },
  { key: 'savage', label: 'Savage', hint: 'Pedes, siap-siap diroast' },
]

const MODES: { key: EatingMode; label: string }[] = [
  { key: 'hemat', label: 'Hemat' },
  { key: 'sehat', label: 'Sehat' },
  { key: 'balanced', label: 'Seimbang' },
]

const VOICES: { key: CimitVoice; label: string; hint: string }[] = [
  { key: 'female', label: 'Cewek', hint: 'Cempreng & anak muda' },
  { key: 'male', label: 'Cowok', hint: 'Berat & dalam' },
]

export default function ProfileScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const profile = useProfile()
  const updateProfile = useUpdateProfile()
  const { plan, openPaywall, openCustomerCenter, restorePurchases } = useSubscription()
  const initial = (user?.displayName ?? user?.email ?? 'C').charAt(0).toUpperCase()

  const tone = profile.data?.cimitTone ?? 'normal'
  const defaultMode = profile.data?.defaultMode ?? 'balanced'
  const [voice, setVoiceState] = useState<CimitVoice>('female')

  useEffect(() => {
    getCimitVoice().then(setVoiceState)
  }, [])

  function setVoice(v: CimitVoice) {
    setVoiceState(v)
    void setCimitVoice(v)
  }

  function setTone(t: CimitTone) {
    updateProfile.mutate({ cimitTone: t }, { onError: (err) => Alert.alert('Gagal', apiErrorMessage(err)) })
  }
  function setMode(m: EatingMode) {
    updateProfile.mutate({ defaultMode: m }, { onError: (err) => Alert.alert('Gagal', apiErrorMessage(err)) })
  }

  async function onRestore() {
    const r = await restorePurchases()
    if (r.ok) Alert.alert('Berhasil', 'Akses lo udah dipulihkan.')
    else Alert.alert('Tidak ditemukan', 'Gak ada pembelian yang bisa dipulihkan.')
  }

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
            Profil
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="pb-16" showsVerticalScrollIndicator={false}>
          <View className="mx-4 mt-4 flex-row items-center gap-4 rounded-card bg-white p-4 dark:bg-zinc-900">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
              <Text className="font-display text-xl font-bold text-primary-700 dark:text-primary-300">
                {initial}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {user?.displayName ?? 'Tamu Cimeat'}
              </Text>
              {user?.email ? (
                <Text className="mt-0.5 font-sans text-sm text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </Text>
              ) : null}
            </View>
            <PlanBadge plan={plan} />
          </View>

          <View className="mx-4 mt-5 overflow-hidden rounded-card bg-primary-600 p-5">
            <View className="flex-row items-center gap-2">
              <CimitMascot size={28} />
              <Text className="font-display text-base font-bold text-white">
                {plan === 'free' ? 'Upgrade Cimeat' : plan === 'pro' ? 'Cimeat Pro' : 'Cimeat MAX'}
              </Text>
            </View>
            <Text className="mt-1 font-sans text-sm leading-5 text-primary-100">
              {plan === 'free'
                ? 'Buka kuota lebih gede buat foto, suara, resep & rekomendasi.'
                : 'Makasih udah dukung Cimeat! Kelola langganan lo di Customer Center.'}
            </Text>
            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => void openPaywall()}
                className="flex-1 items-center rounded-full bg-white py-3 active:opacity-90"
              >
                <Text className="font-sans text-sm font-semibold text-primary-700">
                  {plan === 'free' ? 'Lihat paket' : 'Ganti paket'}
                </Text>
              </Pressable>
              {plan !== 'free' ? (
                <Pressable
                  onPress={() => void openCustomerCenter()}
                  className="flex-1 items-center rounded-full bg-primary-700 py-3 active:opacity-90"
                >
                  <Text className="font-sans text-sm font-semibold text-white">Kelola</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Section title="Kepribadian Cimit">
            <View className="px-4 py-3.5">
              <Text className="mb-2 font-sans text-xs text-zinc-500 dark:text-zinc-400">
                Mau Cimit selembut apa?
              </Text>
              <View className="gap-2">
                {TONES.map((t) => {
                  const active = tone === t.key
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setTone(t.key)}
                      className={
                        active
                          ? 'flex-row items-center gap-3 rounded-2xl border-2 border-primary-500 bg-primary-50 px-3 py-2.5 dark:bg-primary-950'
                          : 'flex-row items-center gap-3 rounded-2xl border-2 border-transparent bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800'
                      }
                    >
                      <CimitMascot size={32} tone={t.key} />
                      <View className="flex-1">
                        <Text className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.label}
                        </Text>
                        <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                          {t.hint}
                        </Text>
                      </View>
                      {active ? (
                        <View className="h-4 w-4 rounded-full bg-primary-600" />
                      ) : (
                        <View className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600" />
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </View>
            <Divider />
            <View className="px-4 py-3.5">
              <Text className="mb-2 font-sans text-sm text-zinc-900 dark:text-zinc-100">
                Suara Cimit
              </Text>
              <View className="gap-2">
                {VOICES.map((v) => {
                  const active = voice === v.key
                  return (
                    <Pressable
                      key={v.key}
                      onPress={() => setVoice(v.key)}
                      className={
                        active
                          ? 'flex-row items-center gap-3 rounded-2xl border-2 border-primary-500 bg-primary-50 px-3 py-2.5 dark:bg-primary-950'
                          : 'flex-row items-center gap-3 rounded-2xl border-2 border-transparent bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800'
                      }
                    >
                      <View className="flex-1">
                        <Text className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {v.label}
                        </Text>
                        <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                          {v.hint}
                        </Text>
                      </View>
                      {active ? (
                        <View className="h-4 w-4 rounded-full bg-primary-600" />
                      ) : (
                        <View className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600" />
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </View>
            <Divider />
            <View className="px-4 py-3.5">
              <Text className="mb-2 font-sans text-sm text-zinc-900 dark:text-zinc-100">
                Mode makan default
              </Text>
              <View className="flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
                {MODES.map((m) => {
                  const active = defaultMode === m.key
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => setMode(m.key)}
                      className={
                        active
                          ? 'flex-1 items-center rounded-full bg-primary-600 py-2'
                          : 'flex-1 items-center rounded-full py-2 active:opacity-60'
                      }
                    >
                      <Text
                        className={
                          active
                            ? 'font-sans text-xs font-semibold text-white'
                            : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                        }
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </Section>

          <Section title="Target & makanan">
            <Row
              icon={<Target size={18} color="#71717a" />}
              label="Target nutrisi"
              hint="Atur kalori & makro harian"
              onPress={() => router.push('/goals')}
            />
            <Divider />
            <Row
              icon={<Apple size={18} color="#71717a" />}
              label="Makanan Saya"
              hint="Makanan custom & favorit"
              onPress={() => router.push('/foods')}
            />
          </Section>

          <Section title="Aplikasi">
            <ThemeSelector />
            <Divider />
            <LangSelector />
          </Section>

          <Section title="Langganan & legal">
            <Row
              icon={<CreditCard size={18} color="#71717a" />}
              label="Customer Center"
              hint="Kelola langganan & invoice"
              onPress={() => void openCustomerCenter()}
            />
            <Divider />
            <Row
              icon={<Heart size={18} color="#71717a" />}
              label="Pulihkan pembelian"
              onPress={onRestore}
            />
            <Divider />
            <Row icon={<Shield size={18} color="#71717a" />} label="Kebijakan privasi" />
          </Section>

          <View className="mx-4 mt-5 rounded-card bg-primary-50 px-4 py-3 dark:bg-zinc-900">
            <Text className="font-sans text-xs leading-4 text-zinc-500 dark:text-zinc-400">
              Cimeat & Cimit kasih estimasi buat bantu lo aware sama makanan. Ini bukan saran
              medis. Konsultasi ke ahli gizi/dokter buat kebutuhan kesehatan spesifik ya.
            </Text>
          </View>

          <View className="mx-4 mt-5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar"
              onPress={() => signOutUser().catch(() => {})}
              className="flex-row items-center justify-center gap-2 rounded-card bg-white py-3.5 active:opacity-80 dark:bg-zinc-900"
            >
              <LogOut size={16} color="#dc2626" />
              <Text className="font-sans text-sm font-semibold text-danger">Keluar</Text>
            </Pressable>
            <Text className="mt-5 text-center font-sans text-xs text-zinc-400">Cimeat v0.2.0</Text>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function LangSelector() {
  const { lang, setLang } = useLang()
  return (
    <View className="px-4 py-3.5">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Globe size={18} color="#71717a" />
        </View>
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">Bahasa</Text>
      </View>
      <View className="mt-3 flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
        {LANG_OPTIONS.map((opt) => {
          const active = lang === opt.key
          return (
            <Pressable
              key={opt.key}
              onPress={() => setLang(opt.key)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              className={
                active
                  ? 'flex-1 items-center rounded-full bg-primary-600 py-2'
                  : 'flex-1 items-center rounded-full py-2 active:opacity-60'
              }
            >
              <Text
                className={
                  active
                    ? 'font-sans text-xs font-semibold text-white'
                    : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                }
              >
                {opt.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const themeOptions: { key: ThemePref; label: string; icon: typeof Sun }[] = [
  { key: 'light', label: 'Terang', icon: Sun },
  { key: 'dark', label: 'Gelap', icon: Moon },
  { key: 'system', label: 'Sistem', icon: Monitor },
]

function ThemeSelector() {
  const { pref, setPref } = useTheme()
  return (
    <View className="px-4 py-3.5">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Moon size={18} color="#71717a" />
        </View>
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">Tema</Text>
      </View>
      <View className="mt-3 flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
        {themeOptions.map((opt) => {
          const active = pref === opt.key
          const Icon = opt.icon
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="button"
              accessibilityLabel={`Tema ${opt.label}`}
              onPress={() => setPref(opt.key)}
              className={
                active
                  ? 'flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-primary-600 py-2'
                  : 'flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2 active:opacity-60'
              }
            >
              <Icon size={15} color={active ? '#ffffff' : '#71717a'} />
              <Text
                className={
                  active
                    ? 'font-sans text-xs font-semibold text-white'
                    : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                }
              >
                {opt.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mx-4 mt-6">
      <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {title}
      </Text>
      <View className="mt-3 overflow-hidden rounded-card bg-white dark:bg-zinc-900">{children}</View>
    </View>
  )
}

function Divider() {
  return <View className="ml-16 h-px bg-zinc-100 dark:bg-zinc-800" />
}

function Row({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">{label}</Text>
        {hint ? (
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">{hint}</Text>
        ) : null}
      </View>
      <ChevronRight size={16} color="#a1a1aa" />
    </Pressable>
  )
}
