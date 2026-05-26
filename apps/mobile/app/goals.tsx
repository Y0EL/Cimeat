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
import { useAccentColor } from '~/lib/use-accent-color'

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
  const router = useRouter()
  const accent = useAccentColor()
  const goals = useGoals()
  const upsert = useUpsertGoal()
  const profile = useProfile()
  const updateProfile = useUpdateProfile()
  const [mode, setMode] = useState<Mode>('manual')

  // manual fields
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

  // auto fields (body metrics)
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
            Target nutrisi
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
          <View className="flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            {(['manual', 'auto'] as Mode[]).map((mk) => {
              const active = mode === mk
              return (
                <Pressable
                  key={mk}
                  onPress={() => setMode(mk)}
                  className={
                    active
                      ? 'flex-1 items-center rounded-full bg-primary-600 py-2'
                      : 'flex-1 items-center rounded-full py-2'
                  }
                >
                  <Text
                    className={
                      active
                        ? 'font-sans text-sm font-semibold text-white'
                        : 'font-sans text-sm font-medium text-zinc-600 dark:text-zinc-300'
                    }
                  >
                    {mk === 'manual' ? 'Manual' : 'Hitung otomatis'}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {mode === 'manual' ? (
            <View className="mt-4">
              <View className="items-center rounded-card bg-white py-5 dark:bg-zinc-900">
                <DonutChart
                  slices={slices}
                  centerLabel="Kalori"
                  centerValue={`${Math.round(Number(calorie) || 0)}`}
                />
                <View className="mt-2 flex-row gap-4">
                  <Legend color={MACRO_COLORS.protein} label="Protein" />
                  <Legend color={MACRO_COLORS.carb} label="Karbo" />
                  <Legend color={MACRO_COLORS.fat} label="Lemak" />
                </View>
              </View>

              <Field label="Target kalori (kkal)">
                <Input value={calorie} onChange={setCalorie} keyboard="number-pad" />
              </Field>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field label="Protein (g)">
                    <Input value={protein} onChange={setProtein} keyboard="number-pad" />
                  </Field>
                </View>
                <View className="flex-1">
                  <Field label="Karbo (g)">
                    <Input value={carb} onChange={setCarb} keyboard="number-pad" />
                  </Field>
                </View>
                <View className="flex-1">
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
                className="mt-3 items-center rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
              >
                <Text className="font-sans text-sm font-semibold text-white">
                  {upsert.isPending ? 'Nyimpen...' : 'Simpan target'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-4">
              <View className="mb-3 flex-row items-center gap-2 rounded-card bg-primary-50 px-4 py-3 dark:bg-primary-950">
                <Sparkles size={16} color={accent} />
                <Text className="flex-1 font-sans text-xs text-zinc-600 dark:text-zinc-300">
                  Isi data tubuh lo, Cimeat hitungin target kalori & makro yang pas.
                </Text>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field label="Tinggi (cm)">
                    <Input value={height} onChange={setHeight} keyboard="number-pad" />
                  </Field>
                </View>
                <View className="flex-1">
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
                className="mt-3 items-center rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
              >
                <Text className="font-sans text-sm font-semibold text-white">
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
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">{label}</Text>
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="0"
      placeholderTextColor="#a1a1aa"
      keyboardType={keyboard}
      className="rounded-input bg-white px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
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
