import { useRouter } from 'expo-router'
import { ChevronLeft, Sparkles } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type {
  ActivityLevel,
  GoalType,
  UpdateProfileInput,
  UpsertNutritionGoalInput,
} from '@cimeat/types'
import { DonutChart } from '~/components/donut-chart'
import { ScreenFade } from '~/components/screen-fade'
import { useGoals, useUpsertGoal } from '~/hooks/use-goals'
import { useProfile, useUpdateProfile } from '~/hooks/use-summary'
import { apiErrorMessage } from '~/lib/api'
import { MACRO_COLORS } from '~/lib/categories'
import { useThemeColors } from '~/lib/theme'

type Mode = 'manual' | 'auto'

const ACTIVITY: { key: ActivityLevel; label: string }[] = [
  { key: 'sedentary', label: 'Jarang' },
  { key: 'light', label: 'Ringan' },
  { key: 'moderate', label: 'Sedang' },
  { key: 'active', label: 'Aktif' },
  { key: 'very_active', label: 'Sangat aktif' },
]

const GOAL_TYPES: { key: GoalType; label: string }[] = [
  { key: 'lose', label: 'Turun BB' },
  { key: 'maintain', label: 'Jaga BB' },
  { key: 'gain', label: 'Naik BB' },
]

export default function GoalsScreen() {
  const c = useThemeColors()
  const router = useRouter()
  const goals = useGoals()
  const upsert = useUpsertGoal()
  const profile = useProfile()
  const updateProfile = useUpdateProfile()
  const [mode, setMode] = useState<Mode>('manual')

  const [calorie, setCalorie] = useState('')
  const [protein, setProtein] = useState('')
  const [carb, setCarb] = useState('')
  const [fat, setFat] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('maintain')

  useEffect(() => {
    if (goals.data) {
      setCalorie(String(goals.data.calorieGoal))
      setProtein(String(Math.round(goals.data.proteinGoal)))
      setCarb(String(Math.round(goals.data.carbGoal)))
      setFat(String(Math.round(goals.data.fatGoal)))
      setGoalType(goals.data.goalType)
    }
  }, [goals.data])

  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [activity, setActivity] = useState<ActivityLevel>('moderate')

  useEffect(() => {
    if (profile.data) {
      if (profile.data.heightCm) setHeight(String(profile.data.heightCm))
      if (profile.data.weightKg) setWeight(String(profile.data.weightKg))
      if (profile.data.birthYear) setBirthYear(String(profile.data.birthYear))
      if (profile.data.sex) setSex(profile.data.sex)
      if (profile.data.activityLevel) setActivity(profile.data.activityLevel)
    }
  }, [profile.data])

  function saveManual() {
    const cal = Number(calorie)
    if (!cal || cal <= 0) {
      Alert.alert('Kalori kosong', 'Isi dulu target kalori harian lo.')
      return
    }
    const input: UpsertNutritionGoalInput = {
      calorieGoal: Math.round(cal),
      proteinGoal: Number(protein) || 0,
      carbGoal: Number(carb) || 0,
      fatGoal: Number(fat) || 0,
      goalType,
    }
    upsert.mutate(input, {
      onSuccess: () => router.back(),
      onError: (err) => Alert.alert('Gagal', apiErrorMessage(err)),
    })
  }

  function saveAuto() {
    const input: UpdateProfileInput = {
      sex,
      activityLevel: activity,
      goalType,
    }
    if (Number(height) > 0) input.heightCm = Number(height)
    if (Number(weight) > 0) input.weightKg = Number(weight)
    if (Number(birthYear) > 0) input.birthYear = Number(birthYear)
    updateProfile.mutate(input, {
      onSuccess: () => {
        Alert.alert('Tersimpan', 'Target lo udah dihitung ulang dari data tubuh.')
        goals.refetch()
        setMode('manual')
      },
      onError: (err) => Alert.alert('Gagal', apiErrorMessage(err)),
    })
  }

  const slices = [
    { name: 'Protein', total: (Number(protein) || 0) * 4, color: MACRO_COLORS.protein },
    { name: 'Karbo', total: (Number(carb) || 0) * 4, color: MACRO_COLORS.carb },
    { name: 'Lemak', total: (Number(fat) || 0) * 9, color: MACRO_COLORS.fat },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScreenFade>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: c.card }}
          >
            <ChevronLeft size={20} color={c.textSub} />
          </Pressable>
          <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 20, color: c.text }}>
            Target nutrisi
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', gap: 4, borderRadius: 99, backgroundColor: c.cardAlt, padding: 4 }}>
            {(['manual', 'auto'] as Mode[]).map((mk) => {
              const active = mode === mk
              return (
                <Pressable
                  key={mk}
                  onPress={() => setMode(mk)}
                  style={{ flex: 1, alignItems: 'center', borderRadius: 99, paddingVertical: 8, backgroundColor: active ? '#FF6B35' : 'transparent' }}
                >
                  <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 14, color: active ? '#ffffff' : c.textSub }}>
                    {mk === 'manual' ? 'Manual' : 'Hitung otomatis'}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {mode === 'manual' ? (
            <View style={{ marginTop: 16 }}>
              <View style={{ alignItems: 'center', borderRadius: 24, backgroundColor: c.card, paddingVertical: 20 }}>
                <DonutChart
                  slices={slices}
                  centerLabel="Kalori"
                  centerValue={`${Math.round(Number(calorie) || 0)}`}
                />
                <View style={{ marginTop: 8, flexDirection: 'row', gap: 16 }}>
                  <Legend color={MACRO_COLORS.protein} label="Protein" />
                  <Legend color={MACRO_COLORS.carb} label="Karbo" />
                  <Legend color={MACRO_COLORS.fat} label="Lemak" />
                </View>
              </View>

              <Field label="Target kalori (kkal)">
                <Input value={calorie} onChange={setCalorie} keyboard="number-pad" />
              </Field>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Protein (g)">
                    <Input value={protein} onChange={setProtein} keyboard="number-pad" />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Karbo (g)">
                    <Input value={carb} onChange={setCarb} keyboard="number-pad" />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Lemak (g)">
                    <Input value={fat} onChange={setFat} keyboard="number-pad" />
                  </Field>
                </View>
              </View>
              <Field label="Tujuan">
                <Segmented
                  options={GOAL_TYPES}
                  value={goalType}
                  onChange={(v) => setGoalType(v as GoalType)}
                />
              </Field>
              <Pressable
                onPress={saveManual}
                disabled={upsert.isPending}
                style={({ pressed }) => ({ marginTop: 12, alignItems: 'center', borderRadius: 99, backgroundColor: '#FF6B35', paddingVertical: 14, opacity: pressed || upsert.isPending ? 0.7 : 1 })}
              >
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>
                  {upsert.isPending ? 'Nyimpen...' : 'Simpan target'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, backgroundColor: c.orangeSoft, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Sparkles size={16} color="#FF6B35" />
                <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 12, color: c.textSub }}>
                  Isi data tubuh lo, Cimeat hitungin target kalori & makro yang pas.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Tinggi (cm)">
                    <Input value={height} onChange={setHeight} keyboard="number-pad" />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Berat (kg)">
                    <Input value={weight} onChange={setWeight} keyboard="decimal-pad" />
                  </Field>
                </View>
              </View>
              <Field label="Tahun lahir">
                <Input value={birthYear} onChange={setBirthYear} keyboard="number-pad" />
              </Field>
              <Field label="Jenis kelamin">
                <Segmented
                  options={[
                    { key: 'male', label: 'Pria' },
                    { key: 'female', label: 'Wanita' },
                  ]}
                  value={sex}
                  onChange={(v) => setSex(v as 'male' | 'female')}
                />
              </Field>
              <Field label="Aktivitas">
                <Segmented
                  options={ACTIVITY}
                  value={activity}
                  onChange={(v) => setActivity(v as ActivityLevel)}
                />
              </Field>
              <Field label="Tujuan">
                <Segmented
                  options={GOAL_TYPES}
                  value={goalType}
                  onChange={(v) => setGoalType(v as GoalType)}
                />
              </Field>
              <Pressable
                onPress={saveAuto}
                disabled={updateProfile.isPending}
                style={({ pressed }) => ({ marginTop: 12, alignItems: 'center', borderRadius: 99, backgroundColor: '#FF6B35', paddingVertical: 14, opacity: pressed || updateProfile.isPending ? 0.7 : 1 })}
              >
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>
                  {updateProfile.isPending ? 'Menghitung...' : 'Hitung target'}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useThemeColors()
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ marginBottom: 6, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
        {label}
      </Text>
      {children}
    </View>
  )
}

function Input({
  value,
  onChange,
  keyboard,
}: {
  value: string
  onChange: (v: string) => void
  keyboard: 'number-pad' | 'decimal-pad'
}) {
  const c = useThemeColors()
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="0"
      placeholderTextColor={c.textSub}
      keyboardType={keyboard}
      style={{ borderRadius: 14, backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 16, color: c.text }}
    />
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const c = useThemeColors()
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const active = value === o.key
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{ borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: active ? '#FF6B35' : c.card }}
          >
            <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : c.textSub }}>
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
