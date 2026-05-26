import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Check, ImageIcon, Mic, Square, Type as TypeIcon } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CreateFoodLogInput, FoodAnalysis, FoodLogSource, MealType } from '@cimeat/types'
import {
  AnalysisResultCard,
  type EditableAnalysis,
} from '~/components/analysis-result-card'
import { QuotaBadge } from '~/components/quota-badge'
import { ScreenFade } from '~/components/screen-fade'
import { useAudioRecording } from '~/hooks/use-audio-log'
import { useCreateFoodLog } from '~/hooks/use-food-logs'
import {
  useAnalyzeAudio,
  useAnalyzeImage,
  useAnalyzeText,
} from '~/hooks/use-food-ai'
import { useSubscription } from '~/hooks/use-subscription'
import { apiErrorMessage, isQuotaExceeded } from '~/lib/api'
import { track } from '~/lib/analytics'
import { useAccentColor } from '~/lib/use-accent-color'

type Tab = 'foto' | 'suara' | 'manual' | 'teks'

const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Sarapan' },
  { key: 'lunch', label: 'Siang' },
  { key: 'dinner', label: 'Malam' },
  { key: 'snack', label: 'Camilan' },
]

function nowIso(): string {
  return new Date().toISOString()
}

function toEditable(a: FoodAnalysis): EditableAnalysis {
  return {
    food_name: a.food_name,
    calories: a.calories,
    protein_g: a.macronutrients.protein_g,
    carbs_g: a.macronutrients.carbs_g,
    fat_g: a.macronutrients.fat_g,
  }
}

export default function LogTab() {
  const accent = useAccentColor()
  const params = useLocalSearchParams<{ tab?: string; mealType?: string }>()
  const initialMeal = (MEAL_TYPES.find((m) => m.key === params.mealType)?.key ?? 'lunch') as MealType
  const initialTab: Tab =
    params.tab === 'suara' || params.tab === 'manual' || params.tab === 'teks'
      ? (params.tab as Tab)
      : 'foto'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [mealType, setMealType] = useState<MealType>(initialMeal)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'foto', label: 'Foto' },
    { key: 'suara', label: 'Suara' },
    { key: 'manual', label: 'Manual' },
    { key: 'teks', label: 'Teks' },
  ]

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
          <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Catat makanan
          </Text>
          {tab === 'foto' ? (
            <QuotaBadge feature="vision" />
          ) : tab === 'suara' ? (
            <QuotaBadge feature="audio" />
          ) : tab === 'teks' ? (
            <QuotaBadge feature="text" />
          ) : null}
        </View>

        <View className="mx-4 mt-1 flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                className={
                  active
                    ? 'flex-1 items-center rounded-full bg-primary-600 py-2'
                    : 'flex-1 items-center rounded-full py-2 active:opacity-60'
                }
              >
                <Text
                  className={
                    active
                      ? 'font-sans text-sm font-semibold text-white'
                      : 'font-sans text-sm font-medium text-zinc-600 dark:text-zinc-300'
                  }
                >
                  {t.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View className="mt-3 px-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {MEAL_TYPES.map((m) => {
              const active = mealType === m.key
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMealType(m.key)}
                  className={
                    active
                      ? 'rounded-full bg-primary-100 px-4 py-1.5 dark:bg-primary-950'
                      : 'rounded-full bg-white px-4 py-1.5 dark:bg-zinc-900'
                  }
                >
                  <Text
                    className={
                      active
                        ? 'font-sans text-xs font-semibold text-primary-700 dark:text-primary-300'
                        : 'font-sans text-xs font-medium text-zinc-500 dark:text-zinc-400'
                    }
                  >
                    {m.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          {tab === 'foto' ? (
            <FotoTab mealType={mealType} accent={accent} />
          ) : tab === 'suara' ? (
            <SuaraTab mealType={mealType} accent={accent} />
          ) : tab === 'teks' ? (
            <TeksTab mealType={mealType} accent={accent} />
          ) : (
            <ManualTab mealType={mealType} />
          )}
        </KeyboardAvoidingView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function useSaveFlow() {
  const router = useRouter()
  const { openPaywall } = useSubscription()

  function done() {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/index')
  }

  function handleError(err: unknown, fallback = 'Coba lagi ya') {
    if (isQuotaExceeded(err)) {
      track('quota_blocked')
      Alert.alert('Jatah harian abis', 'Upgrade buat lanjut pakai fitur ini.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Upgrade', onPress: () => void openPaywall() },
      ])
      return
    }
    Alert.alert('Gagal', apiErrorMessage(err) || fallback)
  }

  return { done, handleError }
}

function FotoTab({ mealType, accent }: { mealType: MealType; accent: string }) {
  const analyze = useAnalyzeImage()
  const create = useCreateFoodLog()
  const { done, handleError } = useSaveFlow()
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [edit, setEdit] = useState<EditableAnalysis | null>(null)

  async function pick(from: 'camera' | 'gallery') {
    try {
      const perm =
        from === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Izin dibutuhkan', 'Cimeat butuh akses kamera/galeri buat foto makanan.')
        return
      }
      const res =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
          : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 })
      const asset = res.assets?.[0]
      if (res.canceled || !asset?.base64) return
      setPreview(asset.uri)
      track('log_food_photo')
      const r = await analyze.mutateAsync({
        image: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
        mealType,
      })
      setResult(r)
      setEdit(toEditable(r))
    } catch (err) {
      handleError(err)
    }
  }

  async function save() {
    if (!result || !edit) return
    try {
      const input: CreateFoodLogInput = {
        source: 'vision',
        mealType,
        foodName: edit.food_name,
        estimatedWeightG: result.estimated_weight_g,
        calories: Math.round(edit.calories),
        proteinG: edit.protein_g,
        carbsG: edit.carbs_g,
        fatG: edit.fat_g,
        healthScore: result.health_score,
        confidenceScore: result.confidence_score,
        eatenAt: nowIso(),
      }
      await create.mutateAsync(input)
      done()
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
      {!result ? (
        <View className="items-center rounded-card bg-white px-6 py-10 dark:bg-zinc-900">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
            <Camera size={28} color={accent} />
          </View>
          <Text className="mt-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
            Foto makanan lo
          </Text>
          <Text className="mt-1 text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
            Cimit bakal deteksi makanan dan estimasi kalorinya.
          </Text>
          {preview && analyze.isPending ? (
            <View className="mt-4 items-center">
              <Image source={{ uri: preview }} className="h-32 w-32 rounded-2xl" />
              <ActivityIndicator className="mt-3" color={accent} />
              <Text className="mt-2 font-sans text-xs text-zinc-400">Lagi nganalisa...</Text>
            </View>
          ) : (
            <View className="mt-5 w-full flex-row gap-3">
              <Pressable
                onPress={() => pick('camera')}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-primary-600 py-3 active:opacity-90"
              >
                <Camera size={18} color="#fff" />
                <Text className="font-sans text-sm font-semibold text-white">Kamera</Text>
              </Pressable>
              <Pressable
                onPress={() => pick('gallery')}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-primary-100 py-3 active:opacity-70 dark:bg-primary-950"
              >
                <ImageIcon size={18} color={accent} />
                <Text className="font-sans text-sm font-semibold text-primary-700 dark:text-primary-300">
                  Galeri
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View>
          {preview ? (
            <Image source={{ uri: preview }} className="mb-3 h-40 w-full rounded-2xl" resizeMode="cover" />
          ) : null}
          <AnalysisResultCard
            analysis={result}
            edit={edit!}
            onChange={(patch) => setEdit((e) => (e ? { ...e, ...patch } : e))}
          />
          <SaveBar pending={create.isPending} onSave={save} onRetry={() => { setResult(null); setEdit(null) }} />
        </View>
      )}
    </ScrollView>
  )
}

function SuaraTab({ mealType }: { mealType: MealType; accent: string }) {
  const rec = useAudioRecording()
  const analyze = useAnalyzeAudio()
  const create = useCreateFoodLog()
  const { done, handleError } = useSaveFlow()
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [edit, setEdit] = useState<EditableAnalysis | null>(null)
  const [weightG, setWeightG] = useState(0)
  const [health, setHealth] = useState(0)
  const [confidence, setConfidence] = useState(0)

  async function start() {
    try {
      await rec.start()
    } catch {
      Alert.alert('Izin mic', 'Cimeat butuh akses mikrofon buat catat pakai suara.')
    }
  }

  async function stop() {
    try {
      const clip = await rec.stop()
      if (!clip) return
      track('log_food_audio')
      const r = await analyze.mutateAsync({ audio: clip.base64, mimeType: clip.mimeType })
      setResult(r)
      setTranscript(r.transcript)
      setEdit(toEditable(r))
      setWeightG(r.estimated_weight_g)
      setHealth(r.health_score)
      setConfidence(r.confidence_score)
    } catch (err) {
      handleError(err)
    }
  }

  async function save() {
    if (!result || !edit) return
    try {
      const input: CreateFoodLogInput = {
        source: 'audio',
        mealType,
        foodName: edit.food_name,
        estimatedWeightG: weightG || undefined,
        calories: Math.round(edit.calories),
        proteinG: edit.protein_g,
        carbsG: edit.carbs_g,
        fatG: edit.fat_g,
        healthScore: health,
        confidenceScore: confidence,
        note: transcript,
        eatenAt: nowIso(),
      }
      await create.mutateAsync(input)
      done()
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
      {!result ? (
        <View className="items-center rounded-card bg-white px-6 py-10 dark:bg-zinc-900">
          <Pressable
            onPress={rec.isRecording ? stop : start}
            disabled={rec.preparing || analyze.isPending}
            className={
              rec.isRecording
                ? 'h-24 w-24 items-center justify-center rounded-full bg-red-500 active:opacity-80'
                : 'h-24 w-24 items-center justify-center rounded-full bg-primary-600 active:opacity-80'
            }
          >
            {analyze.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : rec.isRecording ? (
              <Square size={32} color="#fff" fill="#fff" />
            ) : (
              <Mic size={36} color="#fff" />
            )}
          </Pressable>
          <Text className="mt-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
            {rec.isRecording
              ? `Lagi ngerekam · ${rec.durationSec}s`
              : analyze.isPending
                ? 'Cimit lagi dengerin...'
                : 'Ceritain makanan lo'}
          </Text>
          <Text className="mt-1 text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
            {rec.isRecording
              ? 'Tap lagi buat berhenti & analisa.'
              : 'Contoh: "Tadi gue makan nasi padang sama rendang."'}
          </Text>
        </View>
      ) : (
        <View>
          <AnalysisResultCard
            analysis={result}
            edit={edit!}
            transcript={transcript}
            onChange={(patch) => setEdit((e) => (e ? { ...e, ...patch } : e))}
          />
          <SaveBar pending={create.isPending} onSave={save} onRetry={() => { setResult(null); setEdit(null) }} />
        </View>
      )}
    </ScrollView>
  )
}

function TeksTab({ mealType, accent }: { mealType: MealType; accent: string }) {
  const analyze = useAnalyzeText()
  const create = useCreateFoodLog()
  const { done, handleError } = useSaveFlow()
  const [text, setText] = useState('')
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [edit, setEdit] = useState<EditableAnalysis | null>(null)
  const [weightG, setWeightG] = useState(0)
  const [health, setHealth] = useState(0)
  const [confidence, setConfidence] = useState(0)

  async function run() {
    if (!text.trim()) return
    try {
      track('log_food_text')
      const r = await analyze.mutateAsync({ text: text.trim(), mealType })
      setResult(r)
      setEdit(toEditable(r))
      setWeightG(r.estimated_weight_g)
      setHealth(r.health_score)
      setConfidence(r.confidence_score)
    } catch (err) {
      handleError(err)
    }
  }

  async function save() {
    if (!result || !edit) return
    try {
      const input: CreateFoodLogInput = {
        source: 'text',
        mealType,
        foodName: edit.food_name,
        estimatedWeightG: weightG || undefined,
        calories: Math.round(edit.calories),
        proteinG: edit.protein_g,
        carbsG: edit.carbs_g,
        fatG: edit.fat_g,
        healthScore: health,
        confidenceScore: confidence,
        eatenAt: nowIso(),
      }
      await create.mutateAsync(input)
      done()
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4" keyboardShouldPersistTaps="handled">
      {!result ? (
        <View className="rounded-card bg-white p-4 dark:bg-zinc-900">
          <View className="mb-3 flex-row items-center gap-2">
            <TypeIcon size={18} color={accent} />
            <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Ketik makanan lo
            </Text>
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder='Contoh: "2 potong ayam goreng sama nasi setengah porsi"'
            placeholderTextColor="#a1a1aa"
            multiline
            maxLength={500}
            className="min-h-[96px] rounded-input bg-zinc-100 px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <Pressable
            onPress={run}
            disabled={!text.trim() || analyze.isPending}
            className="mt-3 items-center rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
          >
            <Text className="font-sans text-sm font-semibold text-white">
              {analyze.isPending ? 'Nganalisa...' : 'Analisa'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <AnalysisResultCard
            analysis={result}
            edit={edit!}
            onChange={(patch) => setEdit((e) => (e ? { ...e, ...patch } : e))}
          />
          <SaveBar pending={create.isPending} onSave={save} onRetry={() => { setResult(null); setEdit(null) }} />
        </View>
      )}
    </ScrollView>
  )
}

function ManualTab({ mealType }: { mealType: MealType }) {
  const create = useCreateFoodLog()
  const { done, handleError } = useSaveFlow()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carb, setCarb] = useState('')
  const [fat, setFat] = useState('')

  async function save() {
    if (!name.trim()) {
      Alert.alert('Nama kosong', 'Isi dulu nama makanannya ya.')
      return
    }
    try {
      track('log_food_manual')
      const input: CreateFoodLogInput = {
        source: 'manual' as FoodLogSource,
        mealType,
        foodName: name.trim(),
        calories: Number(calories) || 0,
        proteinG: Number(protein) || 0,
        carbsG: Number(carb) || 0,
        fatG: Number(fat) || 0,
        eatenAt: nowIso(),
      }
      await create.mutateAsync(input)
      done()
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
      <Field label="Nama makanan">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Contoh: Nasi goreng"
          placeholderTextColor="#a1a1aa"
          className="rounded-input bg-white px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </Field>
      <Field label="Kalori (kkal)">
        <TextInput
          value={calories}
          onChangeText={setCalories}
          placeholder="0"
          placeholderTextColor="#a1a1aa"
          keyboardType="number-pad"
          className="rounded-input bg-white px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </Field>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Protein (g)">
            <MacroInput value={protein} onChange={setProtein} />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Karbo (g)">
            <MacroInput value={carb} onChange={setCarb} />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Lemak (g)">
            <MacroInput value={fat} onChange={setFat} />
          </Field>
        </View>
      </View>
      <Pressable
        onPress={save}
        disabled={create.isPending}
        className="mt-3 items-center rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
      >
        <Text className="font-sans text-sm font-semibold text-white">
          {create.isPending ? 'Nyimpen...' : 'Catat sekarang'}
        </Text>
      </Pressable>
      <Text className="mt-3 text-center font-sans text-xs text-zinc-400">
        Tercatat sebagai {MEAL_TYPES.find((m) => m.key === mealType)?.label}
      </Text>
    </ScrollView>
  )
}

function SaveBar({
  pending,
  onSave,
  onRetry,
}: {
  pending: boolean
  onSave: () => void
  onRetry: () => void
}) {
  return (
    <View className="mt-3 flex-row gap-3">
      <Pressable
        onPress={onRetry}
        className="flex-1 items-center justify-center rounded-full bg-zinc-100 py-3.5 active:opacity-70 dark:bg-zinc-800"
      >
        <Text className="font-sans text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Ulangi
        </Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={pending}
        className="flex-[2] flex-row items-center justify-center gap-2 rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
      >
        <Check size={18} color="#fff" />
        <Text className="font-sans text-sm font-semibold text-white">
          {pending ? 'Nyimpen...' : 'Simpan'}
        </Text>
      </Pressable>
    </View>
  )
}

function MacroInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="0"
      placeholderTextColor="#a1a1aa"
      keyboardType="decimal-pad"
      className="rounded-input bg-white px-3 py-3 text-center font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
    />
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
