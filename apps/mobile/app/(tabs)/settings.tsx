import { useRouter } from 'expo-router'
import {
  Apple,
  Bell,
  ChevronRight,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Target,
} from 'lucide-react-native'
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PaywallButton } from '~/components/paywall-button'
import { ScreenFade } from '~/components/screen-fade'
import { TelegramLinkRow } from '~/components/telegram-link-row'
import { WhatsappLinkRow } from '~/components/whatsapp-link-row'
import { useAuth } from '~/hooks/use-auth'
import { useNotifPrefs, useTestNotif, useUpdateNotifPrefs } from '~/hooks/use-notif-prefs'
import { signOutUser } from '~/lib/auth'
import { useLang, type Lang } from '~/lib/lang-context'
import { useTheme, type ThemePref } from '~/lib/theme'

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'en', label: 'EN' },
  { key: 'zh', label: '中' },
]

export default function SettingsTab() {
  const router = useRouter()
  const { user } = useAuth()
  const initial = (user?.displayName ?? user?.email ?? 'C').charAt(0).toUpperCase()

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4 pt-3">
            <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">Akun lo</Text>
            <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Setelan
            </Text>
          </View>

          <View className="mx-4 mt-5 flex-row items-center gap-4 rounded-card bg-white p-4 dark:bg-zinc-900">
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
          </View>

          <View className="mx-4 mt-5 overflow-hidden rounded-card bg-primary-600 p-5">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#ffffff" />
              <Text className="font-display text-base font-bold text-white">Cimeat Pro</Text>
            </View>
            <Text className="mt-1 font-sans text-sm leading-5 text-primary-100">
              Coach tanpa batas, analitik lengkap, dan scan makanan unlimited.
            </Text>
            <View className="mt-4">
              <PaywallButton />
            </View>
          </View>

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

          <Section title="Profil tubuh">
            <BodyMetricsRow onPress={() => router.push('/goals')} />
          </Section>

          <Section title="Channel">
            <TelegramLinkRow />
            <Divider />
            <WhatsappLinkRow />
          </Section>

          <Section title="Notifikasi">
            <NotifPrefsSection />
          </Section>

          <Section title="Aplikasi">
            <ThemeSelector />
            <Divider />
            <LangSelector />
          </Section>

          <Section title="Tentang">
            <Row icon={<Shield size={18} color="#71717a" />} label="Kebijakan privasi" />
          </Section>

          <View className="mx-4 mt-6">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar"
              onPress={() => signOutUser().catch(() => {})}
              className="flex-row items-center justify-center gap-2 rounded-card bg-white py-3.5 active:opacity-80 dark:bg-zinc-900"
            >
              <LogOut size={16} color="#dc2626" />
              <Text className="font-sans text-sm font-semibold text-danger">Keluar</Text>
            </Pressable>
            <Text className="mt-5 text-center font-sans text-xs text-zinc-400">Cimeat v0.1.0</Text>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function BodyMetricsRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Target size={18} color="#71717a" />
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">Data tubuh</Text>
        <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
          Tinggi, berat, usia & aktivitas
        </Text>
      </View>
      <ChevronRight size={16} color="#a1a1aa" />
    </Pressable>
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
              accessibilityState={active ? { selected: true } : {}}
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

function NotifPrefsSection() {
  const prefs = useNotifPrefs()
  const update = useUpdateNotifPrefs()
  const test = useTestNotif()
  const data = prefs.data
  const tokenReady = data?.hasPushToken === true

  function toggle(key: 'mealReminder' | 'weeklyRecap' | 'goalAlerts', value: boolean) {
    update.mutate({ [key]: value })
  }

  return (
    <View>
      <ToggleRow
        icon={<Bell size={18} color="#71717a" />}
        label="Reminder makan"
        hint="Ingetin lo buat catat makan"
        value={data?.mealReminder ?? true}
        onChange={(v) => toggle('mealReminder', v)}
      />
      <Divider />
      <ToggleRow
        icon={<Bell size={18} color="#71717a" />}
        label="Rekap mingguan"
        hint="Ringkasan kalori tiap minggu"
        value={data?.weeklyRecap ?? true}
        onChange={(v) => toggle('weeklyRecap', v)}
      />
      <Divider />
      <ToggleRow
        icon={<Bell size={18} color="#71717a" />}
        label="Alert target"
        hint="Pas kalori lo udah mau tembus target"
        value={data?.goalAlerts ?? true}
        onChange={(v) => toggle('goalAlerts', v)}
      />
      <Divider />
      <Pressable
        onPress={() => {
          if (!tokenReady) {
            Alert.alert('Belum aktif', 'Aktifin izin notifikasi dulu di HP lo.')
            return
          }
          test.mutate(undefined, {
            onSuccess: () => Alert.alert('Tes terkirim', 'Cek notifikasi HP lo.'),
            onError: () => Alert.alert('Gagal', 'Coba lagi ya.'),
          })
        }}
        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Bell size={18} color="#71717a" />
        </View>
        <View className="flex-1">
          <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">
            Coba kirim notif
          </Text>
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
            {tokenReady ? 'Tap buat tes' : 'Aktifin izin notif dulu di HP'}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

function ToggleRow({
  icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">{label}</Text>
        {hint ? (
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">{hint}</Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#ea580c' }} />
    </View>
  )
}
