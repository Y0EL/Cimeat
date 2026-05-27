import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import {
  Camera,
  Check,
  ImageIcon,
  Mic,
  Square,
  Type as TypeIcon,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
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
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
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
import { useThemeColors } from '~/lib/theme'

type Mode = 'foto' | 'suara' | 'manual'

const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Sarapan' },
  { key: 'lunch', label: 'Siang' },
  { key: 'dinner', label: 'Malam' },
  { key: 'snack', label: 'Camilan' },
]

const WAVE_HEIGHTS = [18, 32, 44, 28, 52, 36, 48, 24, 56, 40, 60, 32, 48, 22, 44, 30, 52, 20, 38, 28]

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

function WaveBar({ active, delay, maxH }: { active: boolean; delay: number; maxH: number }) {
  const h = useSharedValue(4)

  useEffect(() => {
    if (active) {
      h.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(maxH, { duration: 200 + delay * 0.3 }),
            withTiming(4, { duration: 200 + delay * 0.3 }),
          ),
          -1,
          false,
        ),
      )
    } else {
      cancelAnimation(h)
      h.value = withTiming(4, { duration: 200 })
    }
  }, [active, h, delay, maxH])

  const style = useAnimatedStyle(() => ({ height: h.value }))
  return <Animated.View style={[{ width: 3, borderRadius: 2, backgroundColor: '#818cf8' }, style]} />
}

function Waveform({ active, analyzing }: { active: boolean; analyzing: boolean }) {
  const pulseH = useSharedValue(4)

  useEffect(() => {
    if (analyzing) {
      pulseH.value = withRepeat(
        withSequence(withTiming(36, { duration: 500 }), withTiming(8, { duration: 500 })),
        -1,
        false,
      )
    } else {
      cancelAnimation(pulseH)
      pulseH.value = withTiming(4, { duration: 200 })
    }
  }, [analyzing, pulseH])

  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 64, justifyContent: 'center', paddingHorizontal: 8 }}>
      {WAVE_HEIGHTS.map((maxH, i) => (
        <WaveBar key={i} active={active && !analyzing} delay={i * 35} maxH={maxH} />
      ))}
    </View>
  )
}

function ModeTab({
  icon: Icon,
  label,
  active,
  color,
  onPress,
}: {
  icon: typeof Camera
  label: string
  active: boolean
  color: string
  onPress: () => void
}) {
  const c = useThemeColors()
  const iconScale = useSharedValue(1)

  useEffect(() => {
    if (active) {
      iconScale.value = withSequence(
        withSpring(1.5, { damping: 5, stiffness: 500 }),
        withSpring(1, { damping: 12 }),
      )
    }
  }, [active, iconScale])

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }))

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 18,
        backgroundColor: active ? color : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Animated.View style={animStyle}>
        <Icon size={18} color={active ? '#ffffff' : c.textSub} />
      </Animated.View>
      <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 14, color: active ? '#ffffff' : c.textSub }}>
        {label}
      </Text>
    </Pressable>
  )
}

export default function LogTab() {
  const c = useThemeColors()
  const params = useLocalSearchParams<{ tab?: string; mealType?: string }>()
  const initialMeal = (MEAL_TYPES.find((m) => m.key === params.mealType)?.key ?? 'lunch') as MealType
  const initialMode: Mode = params.tab === 'suara' ? 'suara' : params.tab === 'manual' ? 'manual' : 'foto'

  const [mode, setMode] = useState<Mode>(initialMode)
  const [mealType, setMealType] = useState<MealType>(initialMeal)
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [edit, setEdit] = useState<EditableAnalysis | null>(null)

  function reset() {
    setResult(null)
    setEdit(null)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScreenFade>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 24, color: c.text }}>
            Catat makanan
          </Text>
          {mode === 'foto' ? (
            <QuotaBadge feature="vision" />
          ) : mode === 'suara' ? (
            <QuotaBadge feature="audio" />
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
          {MEAL_TYPES.map((m) => {
            const active = mealType === m.key
            return (
              <Pressable
                key={m.key}
                onPress={() => setMealType(m.key)}
                style={({ pressed }) => ({
                  borderRadius: 99,
                  backgroundColor: active ? c.orangeSoft : c.card,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderWidth: 1.5,
                  borderColor: active ? c.orange : c.border,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 13, color: active ? c.orange : c.textSub }}>
                  {m.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          {result ? (
            <ResultView
              result={result}
              edit={edit}
              mode={mode}
              mealType={mealType}
              onEditChange={(patch) => setEdit((e) => (e ? { ...e, ...patch } : e))}
              onReset={reset}
            />
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ borderRadius: 28, backgroundColor: c.card, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
                <View style={{ flexDirection: 'row', gap: 4, padding: 6, backgroundColor: c.cardAlt }}>
                  <ModeTab icon={Camera} label="Foto" active={mode === 'foto'} color="#FF6B35" onPress={() => setMode('foto')} />
                  <ModeTab icon={Mic} label="Suara" active={mode === 'suara'} color="#818cf8" onPress={() => setMode('suara')} />
                </View>

                <View style={{ padding: 20 }}>
                  {mode === 'foto' ? (
                    <FotoContent mealType={mealType} onResult={(r) => { setResult(r); setEdit(toEditable(r)) }} />
                  ) : mode === 'suara' ? (
                    <SuaraContent mealType={mealType} onResult={(r) => { setResult(r); setEdit(toEditable(r)) }} />
                  ) : null}
                </View>
              </View>

              <Pressable
                onPress={() => setMode('manual')}
                style={({ pressed }) => ({ marginTop: 16, alignItems: 'center', paddingVertical: 14, borderRadius: 20, backgroundColor: c.card, opacity: pressed ? 0.6 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TypeIcon size={15} color={c.textSub} />
                  <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.textSub }}>Input manual</Text>
                </View>
              </Pressable>

              {mode === 'manual' ? (
                <View style={{ marginTop: 12 }}>
                  <ManualContent mealType={mealType} />
                </View>
              ) : null}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function FotoContent({
  mealType,
  onResult,
}: {
  mealType: MealType
  onResult: (r: FoodAnalysis) => void
}) {
  const c = useThemeColors()
  const analyze = useAnalyzeImage()
  const { handleError } = useSaveFlow()
  const [preview, setPreview] = useState<string | null>(null)

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
      onResult(r)
    } catch (err) {
      handleError(err)
    }
  }

  if (analyze.isPending && preview) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Image source={{ uri: preview }} style={{ width: '100%', height: 140, borderRadius: 16, marginBottom: 16 }} resizeMode="cover" />
        <ActivityIndicator size="large" color={c.orange} />
        <Text style={{ marginTop: 10, fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub }}>
          Cimit lagi nganalisa...
        </Text>
      </View>
    )
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ alignItems: 'center', paddingBottom: 8 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF3EE', alignItems: 'center', justifyContent: 'center' }}>
          <Camera size={26} color="#FF6B35" />
        </View>
        <Text style={{ marginTop: 10, fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.text }}>
          Foto makanan lo
        </Text>
        <Text style={{ marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub, textAlign: 'center' }}>
          Cimit deteksi & estimasi kalori otomatis
        </Text>
      </View>
      <Pressable
        onPress={() => pick('camera')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: 99,
          backgroundColor: '#FF6B35',
          paddingVertical: 13,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Camera size={18} color="#ffffff" />
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>Buka kamera</Text>
      </Pressable>
      <Pressable
        onPress={() => pick('gallery')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: 99,
          backgroundColor: c.cardAlt,
          borderWidth: 1,
          borderColor: c.border,
          paddingVertical: 13,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <ImageIcon size={18} color={c.orange} />
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.orange }}>Pilih dari galeri</Text>
      </Pressable>
    </View>
  )
}

function SuaraContent({
  mealType,
  onResult,
}: {
  mealType: MealType
  onResult: (r: FoodAnalysis) => void
}) {
  const c = useThemeColors()
  const rec = useAudioRecording()
  const analyze = useAnalyzeAudio()
  const { handleError } = useSaveFlow()
  const btnScale = useSharedValue(1)

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }))

  async function start() {
    try {
      btnScale.value = withSequence(withSpring(0.88, { damping: 10 }), withSpring(1, { damping: 12 }))
      await rec.start()
    } catch {
      Alert.alert('Izin mic', 'Cimeat butuh akses mikrofon buat catat pakai suara.')
    }
  }

  async function stop() {
    try {
      btnScale.value = withSequence(withSpring(0.88, { damping: 10 }), withSpring(1, { damping: 12 }))
      const clip = await rec.stop()
      if (!clip) return
      track('log_food_audio')
      const r = await analyze.mutateAsync({ audio: clip.base64, mimeType: clip.mimeType })
      onResult(r)
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <View style={{ alignItems: 'center', paddingVertical: 8, gap: 16 }}>
      <Waveform active={rec.isRecording} analyzing={analyze.isPending} />

      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.text }}>
          {rec.isRecording
            ? `Merekam · ${rec.durationSec}s`
            : analyze.isPending
              ? 'Cimit lagi dengerin...'
              : 'Ceritain makanan lo'}
        </Text>
        <Text style={{ marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub, textAlign: 'center' }}>
          {rec.isRecording
            ? 'Tap berhenti kalau udah selesai'
            : analyze.isPending
              ? 'Proses biasanya 5–10 detik'
              : '"Tadi gue makan nasi padang sama rendang"'}
        </Text>
      </View>

      <Pressable
        onPress={rec.isRecording ? stop : start}
        disabled={rec.preparing || analyze.isPending}
      >
        <Animated.View
          style={[
            {
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: rec.isRecording ? '#ef4444' : '#818cf8',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: rec.isRecording ? '#ef4444' : '#818cf8',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 14,
              elevation: 8,
              opacity: rec.preparing || analyze.isPending ? 0.6 : 1,
            },
            btnStyle,
          ]}
        >
          {analyze.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : rec.isRecording ? (
            <Square size={26} color="#fff" fill="#fff" />
          ) : (
            <Mic size={30} color="#fff" />
          )}
        </Animated.View>
      </Pressable>
    </View>
  )
}

function ManualContent({ mealType }: { mealType: MealType }) {
  const c = useThemeColors()
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

  const inputStyle = {
    borderRadius: 14,
    backgroundColor: c.cardAlt,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Outfit_400Regular' as const,
    fontSize: 15,
    color: c.text,
  }

  return (
    <View style={{ borderRadius: 28, backgroundColor: c.card, padding: 20, gap: 10 }}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nama makanan"
        placeholderTextColor={c.textSub}
        style={inputStyle}
      />
      <TextInput
        value={calories}
        onChangeText={setCalories}
        placeholder="Kalori (kkal)"
        placeholderTextColor={c.textSub}
        keyboardType="number-pad"
        style={inputStyle}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: 'Protein g', val: protein, set: setProtein },
          { label: 'Karbo g', val: carb, set: setCarb },
          { label: 'Lemak g', val: fat, set: setFat },
        ].map((f) => (
          <View key={f.label} style={{ flex: 1 }}>
            <Text style={{ marginBottom: 4, fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: c.textSub, textAlign: 'center' }}>
              {f.label}
            </Text>
            <TextInput
              value={f.val}
              onChangeText={f.set}
              placeholder="0"
              placeholderTextColor={c.textSub}
              keyboardType="decimal-pad"
              style={{ ...inputStyle, textAlign: 'center', paddingHorizontal: 8 }}
            />
          </View>
        ))}
      </View>
      <Pressable
        onPress={save}
        disabled={create.isPending}
        style={({ pressed }) => ({
          borderRadius: 99,
          backgroundColor: c.orange,
          paddingVertical: 13,
          alignItems: 'center',
          opacity: pressed || create.isPending ? 0.7 : 1,
        })}
      >
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>
          {create.isPending ? 'Nyimpen...' : 'Catat sekarang'}
        </Text>
      </Pressable>
    </View>
  )
}

function ResultView({
  result,
  edit,
  mode,
  mealType,
  onEditChange,
  onReset,
}: {
  result: FoodAnalysis
  edit: EditableAnalysis | null
  mode: Mode
  mealType: MealType
  onEditChange: (patch: Partial<EditableAnalysis>) => void
  onReset: () => void
}) {
  const c = useThemeColors()
  const create = useCreateFoodLog()
  const { done, handleError } = useSaveFlow()
  const transcript = (result as FoodAnalysis & { transcript?: string }).transcript ?? ''

  async function save() {
    if (!edit) return
    try {
      const input: CreateFoodLogInput = {
        source: mode === 'foto' ? 'vision' : mode === 'suara' ? 'audio' : ('manual' as FoodLogSource),
        mealType,
        foodName: edit.food_name,
        estimatedWeightG: result.estimated_weight_g || undefined,
        calories: Math.round(edit.calories),
        proteinG: edit.protein_g,
        carbsG: edit.carbs_g,
        fatG: edit.fat_g,
        healthScore: result.health_score,
        confidenceScore: result.confidence_score,
        note: transcript || undefined,
        eatenAt: nowIso(),
      }
      await create.mutateAsync(input)
      done()
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
      <AnalysisResultCard
        analysis={result}
        edit={edit!}
        transcript={transcript}
        onChange={onEditChange}
      />
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={onReset}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 99,
            backgroundColor: c.cardAlt,
            paddingVertical: 14,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.textSub }}>Ulangi</Text>
        </Pressable>
        <Pressable
          onPress={save}
          disabled={create.isPending}
          style={({ pressed }) => ({
            flex: 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 99,
            backgroundColor: c.orange,
            paddingVertical: 14,
            opacity: pressed || create.isPending ? 0.8 : 1,
          })}
        >
          <Check size={18} color="#ffffff" />
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>
            {create.isPending ? 'Nyimpen...' : 'Simpan'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

function useSaveFlow() {
  const router = useRouter()
  const { openPaywall } = useSubscription()

  function done() {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/index')
  }

  function handleError(err: unknown) {
    if (isQuotaExceeded(err)) {
      track('quota_blocked')
      Alert.alert('Jatah harian abis', 'Upgrade buat lanjut pakai fitur ini.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Upgrade', onPress: () => void openPaywall() },
      ])
      return
    }
    Alert.alert('Gagal', apiErrorMessage(err))
  }

  return { done, handleError }
}
