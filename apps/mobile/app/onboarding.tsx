import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Camera, Flame, Mic, Sparkles } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import type {
  ActivityLevel,
  CimitTone,
  EatingMode,
  GoalType,
  UpdateProfileInput,
} from '@cimeat/types'
import { CimitMascot } from '~/components/cimit/cimit-mascot'
import { useUpdateProfile } from '~/hooks/use-summary'
import { useAccentColor } from '~/lib/use-accent-color'

export const ONBOARDING_KEY = 'cimeat.onboarding.done'

const INTRO = [
  {
    icon: Flame,
    title: 'Kenalin, Cimit!',
    body: 'Teman makan lo yang bakal bantu catat kalori, kasih saran, dan kadang roast biar on-track.',
  },
  {
    icon: Camera,
    title: 'Foto atau ngomong aja',
    body: 'Foto makanan atau ceritain pakai suara, Cimit estimasi kalori & makronya otomatis.',
  },
  {
    icon: Mic,
    title: 'Resep & makan di sekitar',
    body: 'Bingung mau makan apa? Cimit kasih ide resep dari bahan yang ada atau rekomendasi terdekat.',
  },
]

const TONES: { key: CimitTone; label: string; hint: string }[] = [
  { key: 'soft', label: 'Lembut', hint: 'Sabar & nyemangatin' },
  { key: 'normal', label: 'Normal', hint: 'Santai tapi jujur' },
  { key: 'savage', label: 'Savage', hint: 'Pedes, siap diroast' },
]

const EAT_MODES: { key: EatingMode; label: string }[] = [
  { key: 'hemat', label: 'Hemat' },
  { key: 'sehat', label: 'Sehat' },
  { key: 'balanced', label: 'Seimbang' },
]

const ACTIVITY: { key: ActivityLevel; label: string }[] = [
  { key: 'sedentary', label: 'Jarang gerak' },
  { key: 'light', label: 'Ringan' },
  { key: 'moderate', label: 'Sedang' },
  { key: 'active', label: 'Aktif' },
  { key: 'very_active', label: 'Sangat aktif' },
]

const GOALS: { key: GoalType; label: string }[] = [
  { key: 'lose', label: 'Turun BB' },
  { key: 'maintain', label: 'Jaga BB' },
  { key: 'gain', label: 'Naik BB' },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const accent = useAccentColor()
  const updateProfile = useUpdateProfile()
  const [step, setStep] = useState(0)
  const TOTAL = INTRO.length + 1

  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [activity, setActivity] = useState<ActivityLevel>('moderate')
  const [goalType, setGoalType] = useState<GoalType>('maintain')
  const [cimitTone, setCimitTone] = useState<CimitTone>('normal')
  const [defaultMode, setDefaultMode] = useState<EatingMode>('balanced')

  const opacity = useSharedValue(1)
  const translateY = useSharedValue(0)
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => {})
    router.replace('/(tabs)/index')
  }

  function animateTo(next: number) {
    opacity.value = withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) }, () => {
      translateY.value = 12
      runOnJS(setStep)(next)
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
      translateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    })
  }

  function saveAndFinish() {
    const input: UpdateProfileInput = {
      sex,
      activityLevel: activity,
      goalType,
      cimitTone,
      defaultMode,
    }
    if (Number(height) > 0) input.heightCm = Number(height)
    if (Number(weight) > 0) input.weightKg = Number(weight)
    if (Number(birthYear) > 0) input.birthYear = Number(birthYear)
    updateProfile.mutate(input, {
      onSuccess: () => void finish(),
      onError: () => {
        Alert.alert('Tetap lanjut', 'Target bisa lo atur lagi nanti di Setelan.')
        void finish()
      },
    })
  }

  const isGoalStep = step >= INTRO.length

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-center gap-2 pt-5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View
            key={i}
            style={{
              height: 5,
              width: i === step ? 22 : 6,
              borderRadius: 99,
              backgroundColor: i <= step ? accent : '#fed7aa',
            }}
          />
        ))}
      </View>

      {!isGoalStep ? (
        <>
          <Animated.View
            style={[
              { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
              animStyle,
            ]}
          >
            <Intro index={step} accent={accent} />
          </Animated.View>
          <View className="gap-2 px-6 pb-6">
            <Pressable
              onPress={() => animateTo(step + 1)}
              className="items-center rounded-full bg-primary-600 py-4 active:opacity-80"
            >
              <Text className="font-sans text-base font-semibold text-white">Lanjut</Text>
            </Pressable>
            <Pressable
              onPress={() => animateTo(INTRO.length)}
              className="items-center py-2.5 active:opacity-60"
            >
              <Text className="font-sans text-sm text-zinc-400">Lewati</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Animated.View style={[{ flex: 1 }, animStyle]}>
          <ScrollView contentContainerClassName="px-6 pb-6 pt-6" keyboardShouldPersistTaps="handled">
            <View className="mb-4 items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
                <Sparkles size={28} color={accent} />
              </View>
              <Text className="mt-4 text-center font-display text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Atur target lo
              </Text>
              <Text className="mt-1 text-center font-sans text-sm text-zinc-500 dark:text-zinc-400">
                Biar Cimeat hitung kalori yang pas buat lo.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Label>Tinggi (cm)</Label>
                <Input value={height} onChange={setHeight} />
              </View>
              <View className="flex-1">
                <Label>Berat (kg)</Label>
                <Input value={weight} onChange={setWeight} />
              </View>
            </View>
            <Label>Tahun lahir</Label>
            <Input value={birthYear} onChange={setBirthYear} />
            <Label>Jenis kelamin</Label>
            <Chips
              options={[
                { key: 'male', label: 'Pria' },
                { key: 'female', label: 'Wanita' },
              ]}
              value={sex}
              onChange={(v) => setSex(v as 'male' | 'female')}
            />
            <Label>Aktivitas</Label>
            <Chips
              options={ACTIVITY}
              value={activity}
              onChange={(v) => setActivity(v as ActivityLevel)}
            />
            <Label>Tujuan</Label>
            <Chips options={GOALS} value={goalType} onChange={(v) => setGoalType(v as GoalType)} />

            <Label>Mode makan default</Label>
            <Chips
              options={EAT_MODES}
              value={defaultMode}
              onChange={(v) => setDefaultMode(v as EatingMode)}
            />

            <Label>Gaya Cimit</Label>
            <View className="gap-2">
              {TONES.map((t) => {
                const active = cimitTone === t.key
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setCimitTone(t.key)}
                    className={
                      active
                        ? 'flex-row items-center gap-3 rounded-2xl border-2 border-primary-500 bg-primary-50 px-3 py-2.5 dark:bg-primary-950'
                        : 'flex-row items-center gap-3 rounded-2xl border-2 border-transparent bg-white px-3 py-2.5 dark:bg-zinc-900'
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
                  </Pressable>
                )
              })}
            </View>

            <Pressable
              onPress={saveAndFinish}
              disabled={updateProfile.isPending}
              className="mt-6 items-center rounded-full bg-primary-600 py-4 active:opacity-80 disabled:opacity-50"
            >
              <Text className="font-sans text-base font-semibold text-white">
                {updateProfile.isPending ? 'Menghitung...' : 'Mulai pakai Cimeat'}
              </Text>
            </Pressable>
            <Pressable onPress={() => void finish()} className="items-center py-2.5 active:opacity-60">
              <Text className="font-sans text-sm text-zinc-400">Nanti aja</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

function Intro({ index, accent }: { index: number; accent: string }) {
  const item = INTRO[index] ?? INTRO[0] ?? { icon: Flame, title: '', body: '' }
  const Icon = item.icon
  return (
    <>
      <View
        style={{
          height: 100,
          width: 100,
          borderRadius: 50,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${accent}18`,
        }}
      >
        <Icon size={46} color={accent} />
      </View>
      <Text className="mt-8 text-center font-display text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
        {item.title}
      </Text>
      <Text className="mt-4 max-w-[290px] text-center font-sans text-base leading-7 text-zinc-500 dark:text-zinc-400">
        {item.body}
      </Text>
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-1.5 mt-3 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </Text>
  )
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="0"
      placeholderTextColor="#a1a1aa"
      keyboardType="number-pad"
      className="rounded-input bg-white px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
    />
  )
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.key
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            className={
              active
                ? 'rounded-full bg-primary-600 px-4 py-2'
                : 'rounded-full bg-white px-4 py-2 dark:bg-zinc-900'
            }
          >
            <Text
              className={
                active
                  ? 'font-sans text-xs font-semibold text-white'
                  : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
              }
            >
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
