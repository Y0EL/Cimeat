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
  Sparkles,
  Sun,
  Target,
  Trophy,
  Zap,
} from 'lucide-react-native'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CimitTone, CimitVoice, EatingMode } from '@cimeat/types'
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7F4' }} edges={['top']}>
      <ScreenFade>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFFFFF' }}
          >
            <ChevronLeft size={20} color="#8A8886" />
          </Pressable>
          <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: '#1A1C1E' }}>
            Profil
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 64 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 16, shadowColor: '#1A1C1E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF3EE', borderWidth: 3, borderColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: '#FF6B35' }}>
                {initial}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1A1C1E' }}>
                {user?.displayName ?? 'Tamu Cimeat'}
              </Text>
              {user?.email ? (
                <Text style={{ marginTop: 2, fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A8886' }}>
                  {user.email}
                </Text>
              ) : null}
            </View>
            <PlanBadge plan={plan} />
          </View>

          <View style={{ marginHorizontal: 16, marginTop: 16, overflow: 'hidden', borderRadius: 24, backgroundColor: '#FF6B35', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#ffffff" />
              </View>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>
                {plan === 'free' ? 'Upgrade Cimeat' : plan === 'pro' ? 'Cimeat Pro' : 'Cimeat MAX'}
              </Text>
            </View>
            <Text style={{ marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.85)' }}>
              {plan === 'free'
                ? 'Buka kuota lebih gede buat foto, suara, resep & rekomendasi.'
                : 'Makasih udah dukung Cimeat! Kelola langganan lo di Customer Center.'}
            </Text>
            <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => void openPaywall()}
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', borderRadius: 99, backgroundColor: '#FFFFFF', paddingVertical: 12, opacity: pressed ? 0.85 : 1 })}
              >
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#FF6B35' }}>
                  {plan === 'free' ? 'Lihat paket' : 'Ganti paket'}
                </Text>
              </Pressable>
              {plan !== 'free' ? (
                <Pressable
                  onPress={() => void openCustomerCenter()}
                  style={({ pressed }) => ({ flex: 1, alignItems: 'center', borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, opacity: pressed ? 0.85 : 1 })}
                >
                  <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>Kelola</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Section title="Kepribadian Cimit">
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ marginBottom: 8, fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A8886' }}>
                Mau Cimit selembut apa?
              </Text>
              <View style={{ gap: 8 }}>
                {TONES.map((t) => {
                  const active = tone === t.key
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setTone(t.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: active ? '#FF6B35' : 'transparent',
                        backgroundColor: active ? '#FFF3EE' : '#F8F7F4',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: active ? '#FF6B35' : '#E8E6E0', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={14} color={active ? '#ffffff' : '#8A8886'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1A1C1E' }}>
                          {t.label}
                        </Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A8886' }}>
                          {t.hint}
                        </Text>
                      </View>
                      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: active ? '#FF6B35' : 'transparent', borderWidth: active ? 0 : 1.5, borderColor: '#D0CEC9' }} />
                    </Pressable>
                  )
                })}
              </View>
            </View>
            <Divider />
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ marginBottom: 8, fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1A1C1E' }}>
                Suara Cimit
              </Text>
              <View style={{ gap: 8 }}>
                {VOICES.map((v) => {
                  const active = voice === v.key
                  return (
                    <Pressable
                      key={v.key}
                      onPress={() => setVoice(v.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: active ? '#FF6B35' : 'transparent',
                        backgroundColor: active ? '#FFF3EE' : '#F8F7F4',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1A1C1E' }}>
                          {v.label}
                        </Text>
                        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A8886' }}>
                          {v.hint}
                        </Text>
                      </View>
                      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: active ? '#FF6B35' : 'transparent', borderWidth: active ? 0 : 1.5, borderColor: '#D0CEC9' }} />
                    </Pressable>
                  )
                })}
              </View>
            </View>
            <Divider />
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ marginBottom: 8, fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1A1C1E' }}>
                Mode makan default
              </Text>
              <View style={{ flexDirection: 'row', gap: 4, borderRadius: 99, backgroundColor: '#F8F7F4', padding: 4 }}>
                {MODES.map((m) => {
                  const active = defaultMode === m.key
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => setMode(m.key)}
                      style={{ flex: 1, alignItems: 'center', borderRadius: 99, paddingVertical: 8, backgroundColor: active ? '#FF6B35' : 'transparent' }}
                    >
                      <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : '#8A8886' }}>
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

          <View style={{ marginHorizontal: 16, marginTop: 20, borderRadius: 20, backgroundColor: '#FFF3EE', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: '#8A8886' }}>
              Cimeat & Cimit kasih estimasi buat bantu lo aware sama makanan. Ini bukan saran
              medis. Konsultasi ke ahli gizi/dokter buat kebutuhan kesehatan spesifik ya.
            </Text>
          </View>

          <View style={{ marginHorizontal: 16, marginTop: 20 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar"
              onPress={() => signOutUser().catch(() => {})}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, backgroundColor: '#FFFFFF', paddingVertical: 14, opacity: pressed ? 0.75 : 1 })}
            >
              <LogOut size={16} color="#ef4444" />
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ef4444' }}>Keluar</Text>
            </Pressable>
            <Text style={{ marginTop: 20, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#D0CEC9' }}>Cimeat v0.2.0</Text>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function LangSelector() {
  const { lang, setLang } = useLang()
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F8F7F4' }}>
          <Globe size={18} color="#8A8886" />
        </View>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1A1C1E' }}>Bahasa</Text>
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 4, borderRadius: 99, backgroundColor: '#F8F7F4', padding: 4 }}>
        {LANG_OPTIONS.map((opt) => {
          const active = lang === opt.key
          return (
            <Pressable
              key={opt.key}
              onPress={() => setLang(opt.key)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              style={{ flex: 1, alignItems: 'center', borderRadius: 99, paddingVertical: 8, backgroundColor: active ? '#FF6B35' : 'transparent' }}
            >
              <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : '#8A8886' }}>
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
    <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F8F7F4' }}>
          <Moon size={18} color="#8A8886" />
        </View>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1A1C1E' }}>Tema</Text>
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 4, borderRadius: 99, backgroundColor: '#F8F7F4', padding: 4 }}>
        {themeOptions.map((opt) => {
          const active = pref === opt.key
          const Icon = opt.icon
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="button"
              accessibilityLabel={`Tema ${opt.label}`}
              onPress={() => setPref(opt.key)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 99, paddingVertical: 8, backgroundColor: active ? '#FF6B35' : 'transparent' }}
            >
              <Icon size={14} color={active ? '#ffffff' : '#8A8886'} />
              <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : '#8A8886' }}>
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
    <View style={{ marginHorizontal: 16, marginTop: 24 }}>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8886' }}>
        {title}
      </Text>
      <View style={{ marginTop: 10, overflow: 'hidden', borderRadius: 24, backgroundColor: '#FFFFFF', shadowColor: '#1A1C1E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
        {children}
      </View>
    </View>
  )
}

function Divider() {
  return <View style={{ marginLeft: 64, height: 1, backgroundColor: '#F0EEE9' }} />
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
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: pressed ? '#FFF3EE' : 'transparent' })}
    >
      <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F8F7F4' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1A1C1E' }}>{label}</Text>
        {hint ? (
          <Text style={{ marginTop: 2, fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A8886' }}>{hint}</Text>
        ) : null}
      </View>
      <ChevronRight size={16} color="#D0CEC9" />
    </Pressable>
  )
}
