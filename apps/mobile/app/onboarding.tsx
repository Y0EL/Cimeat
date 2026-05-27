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
import { useUpdateProfile } from '~/hooks/use-summary'

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7F4' }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 20 }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View
            key={i}
            style={{
              height: 5,
              width: i === step ? 22 : 6,
              borderRadius: 99,
              backgroundColor: i <= step ? '#FF6B35' : '#FF6B3530',
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
            <Intro index={step} />
          </Animated.View>
          <View style={{ gap: 8, paddingHorizontal: 24, paddingBottom: 24 }}>
            <Pressable
              onPress={() => animateTo(step + 1)}
              style={({ pressed }) => ({ alignItems: 'center', borderRadius: 99, backgroundColor: '#FF6B35', paddingVertical: 16, opacity: pressed ? 0.85 : 1 })}
            >
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>Lanjut</Text>
            </Pressable>
            <Pressable
              onPress={() => animateTo(INTRO.length)}
              style={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A8886' }}>Lewati</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Animated.View style={[{ flex: 1 }, animStyle]}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 24 }} keyboardShouldPersistTaps="handled">
            <View style={{ marginBottom: 16, alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: '#FFF3EE' }}>
                <Sparkles size={28} color="#FF6B35" />
              </View>
              <Text style={{ marginTop: 16, textAlign: 'center', fontFamily: 'Outfit_900Black', fontSize: 24, color: '#1A1C1E' }}>
                Atur target lo
              </Text>
              <Text style={{ marginTop: 4, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A8886' }}>
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
            <View style={{ gap: 8 }}>
              {TONES.map((t) => {
                const active = cimitTone === t.key
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setCimitTone(t.key)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: active ? '#FF6B35' : 'transparent',
                      backgroundColor: active ? '#FFF3EE' : '#FFFFFF',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: active ? '#FF6B35' : '#F0EEE9', alignItems: 'center', justifyContent: 'center' }}>
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
                  </Pressable>
                )
              })}
            </View>

            <Pressable
              onPress={saveAndFinish}
              disabled={updateProfile.isPending}
              style={({ pressed }) => ({ marginTop: 24, alignItems: 'center', borderRadius: 99, backgroundColor: '#FF6B35', paddingVertical: 16, opacity: pressed || updateProfile.isPending ? 0.7 : 1 })}
            >
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>
                {updateProfile.isPending ? 'Menghitung...' : 'Mulai pakai Cimeat'}
              </Text>
            </Pressable>
            <Pressable onPress={() => void finish()} style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A8886' }}>Nanti aja</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

function Intro({ index }: { index: number }) {
  const item = INTRO[index] ?? INTRO[0] ?? { icon: Flame, title: '', body: '' }
  const Icon = item.icon
  return (
    <>
      <View
        style={{
          position: 'absolute',
          top: -80,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: '#FF6B35',
          opacity: 0.08,
        }}
      />
      <View
        style={{
          height: 100,
          width: 100,
          borderRadius: 50,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFF3EE',
          shadowColor: '#FF6B35',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <Icon size={46} color="#FF6B35" />
      </View>
      <Text style={{ marginTop: 32, textAlign: 'center', fontFamily: 'Outfit_900Black', fontSize: 30, color: '#1A1C1E' }}>
        {item.title}
      </Text>
      <Text style={{ marginTop: 16, maxWidth: 290, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 16, lineHeight: 26, color: '#8A8886' }}>
        {item.body}
      </Text>
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ marginBottom: 6, marginTop: 12, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8886' }}>
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
      placeholderTextColor="#8A8886"
      keyboardType="number-pad"
      style={{ borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#1A1C1E' }}
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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const active = value === o.key
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{ borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: active ? '#FF6B35' : '#FFFFFF' }}
          >
            <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : '#1A1C1E' }}>
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
