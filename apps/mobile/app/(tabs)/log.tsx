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
  const c = useThemeColors()
  const h = useSharedValue(4)

  useEffect(() => {
    if (active) {
      h.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(maxH, { duration: 180 + delay * 0.4 }),
            withTiming(4, { duration: 180 + delay * 0.4 }),
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

  return (
    <Animated.View
      style={[{ width: 4, borderRadius: 2, backgroundColor: c.orange }, style]}
    />
  )
}

const WAVE_HEIGHTS = [18, 32, 44, 28, 52, 36, 48, 24, 56, 40, 60, 32, 48, 22, 44, 30, 52, 20, 38, 28]

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

  if (analyzing) {
    return (
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 60, justifyContent: 'center' }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const style = useAnimatedStyle(() => ({ height: pulseH.value }))
          return (
            <Animated.View
              key={i}
              style={[{ width: 4, borderRadius: 2, backgroundColor: '#FF6B35', opacity: 0.4 + (i % 3) * 0.2 }, style]}
            />
          )
        })}
      </View>
    )
  }

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 60, justifyContent: 'center' }}>
      {WAVE_HEIGHTS.map((maxH, i) => (
        <WaveBar key={i} active={active} delay={i * 40} maxH={maxH} />
      ))}
    </View>
  )
}

function AnimatedOptionCard({
  icon: Icon,
  title,
  subtitle,
  active,
  onPress,
  color,
}: {
  icon: typeof Camera
  title: string
  subtitle: string
  active: boolean
  onPress: () => void
  color: string
}) {
  const c = useThemeColors()
  const iconScale = useSharedValue(1)
  const cardScale = useSharedValue(1)

  useEffect(() => {
    if (active) {
      iconScale.value = withSequence(
        withSpring(1.45, { damping: 5, stiffness: 450 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      )
      cardScale.value = withSequence(
        withSpring(0.96, { damping: 10 }),
        withSpring(1, { damping: 12 }),
      )
    }
  }, [active, iconScale, cardScale])

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }))
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }))

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.9 : 1 })}
    >
      <Animated.View
        style={[
          {
            borderRadius: 28,
            backgroundColor: active ? color : c.card,
            padding: 20,
            alignItems: 'center',
            borderWidth: active ? 0 : 1,
            borderColor: c.border,
            shadowColor: active ? color : c.shadow,
            shadowOffset: { width: 0, height: active ? 8 : 2 },
            shadowOpacity: active ? 0.35 : 0.06,
            shadowRadius: active ? 20 : 8,
            elevation: active ? 8 : 2,
          },
          cardStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: active ? 'rgba(255,255,255,0.22)' : c.cardAlt,
              alignItems: 'center',
              justifyContent: 'center',
            },
            iconStyle,
          ]}
        >
          <Icon size={26} color={active ? '#ffffff' : color} />
        </Animated.View>
        <Text
          style={{
            marginTop: 12,
            fontFamily: 'Outfit_900Black',
            fontSize: 16,
            color: active ? '#ffffff' : c.text,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: 'Outfit_400Regular',
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 16,
            color: active ? 'rgba(255,255,255,0.75)' : c.textSub,
          }}
        >
          {subtitle}
        </Text>
      </Animated.View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <View>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub }}>
              {mealType === 'breakfast' ? 'Sarapan' : mealType === 'lunch' ? 'Makan siang' : mealType === 'dinner' ? 'Makan malam' : 'Camilan'}
            </Text>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: c.text, marginTop: 2 }}>
              Catat makanan
            </Text>
          </View>
          {mode === 'foto' ? (
            <QuotaBadge feature="vision" />
          ) : mode === 'suara' ? (
            <QuotaBadge feature="audio" />
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {MEAL_TYPES.map((m) => {
            const active = mealType === m.key
            return (
              <Pressable
                key={m.key}
                onPress={() => setMealType(m.key)}
                style={({ pressed }) => ({
                  borderRadius: 99,
                  backgroundColor: active ? c.orangeSoft : c.card,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderWidth: active ? 1.5 : 1,
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
        </ScrollView>

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
            >
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <AnimatedOptionCard
                  icon={Camera}
                  title="Foto"
                  subtitle="Foto makanan, deteksi instan"
                  active={mode === 'foto'}
                  onPress={() => setMode('foto')}
                  color="#FF6B35"
                />
                <AnimatedOptionCard
                  icon={Mic}
                  title="Suara"
                  subtitle="Sebut aja makanan lo"
                  active={mode === 'suara'}
                  onPress={() => setMode('suara')}
                  color="#818cf8"
                />
              </View>

              {mode === 'foto' ? (
                <FotoContent mealType={mealType} onResult={(r) => { setResult(r); setEdit(toEditable(r)) }} />
              ) : mode === 'suara' ? (
                <SuaraContent mealType={mealType} onResult={(r) => { setResult(r); setEdit(toEditable(r)) }} />
              ) : (
                <ManualContent mealType={mealType} />
              )}

              <Pressable
                onPress={() => setMode('manual')}
                style={({ pressed }) => ({ marginTop: 20, alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TypeIcon size={14} color={c.textSub} />
                  <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub }}>
                    Catat manual
                  </Text>
                </View>
              </Pressable>
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
      <View style={{ borderRadius: 28, backgroundColor: c.card, padding: 24, alignItems: 'center' }}>
        <Image source={{ uri: preview }} style={{ width: '100%', height: 160, borderRadius: 20, marginBottom: 16 }} resizeMode="cover" />
        <ActivityIndicator size="large" color={c.orange} />
        <Text style={{ marginTop: 12, fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.textSub }}>
          Cimit lagi nganalisa...
        </Text>
      </View>
    )
  }

  return (
    <View style={{ borderRadius: 28, backgroundColor: c.card, padding: 20, gap: 12 }}>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: c.textSub, textAlign: 'center', lineHeight: 18 }}>
        Pilih sumber foto untuk deteksi otomatis
      </Text>
      <Pressable
        onPress={() => pick('camera')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: 99,
          backgroundColor: c.orange,
          paddingVertical: 14,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Camera size={20} color="#ffffff" />
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#ffffff' }}>Buka kamera</Text>
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
          paddingVertical: 14,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <ImageIcon size={20} color={c.orange} />
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.orange }}>Pilih dari galeri</Text>
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
      onResult(r)
    } catch (err) {
      handleError(err)
    }
  }

  const isActive = rec.isRecording || analyze.isPending

  return (
    <View style={{ borderRadius: 28, backgroundColor: c.card, padding: 24, alignItems: 'center' }}>
      <Waveform active={rec.isRecording} analyzing={analyze.isPending} />

      <Text style={{ marginTop: 16, fontFamily: 'Outfit_900Black', fontSize: 18, color: c.text, textAlign: 'center' }}>
        {rec.isRecording
          ? `Lagi ngerekam · ${rec.durationSec}s`
          : analyze.isPending
            ? 'Cimit lagi dengerin...'
            : 'Ceritain makanan lo'}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub, textAlign: 'center', lineHeight: 18 }}>
        {rec.isRecording
          ? 'Tap berhenti kalau udah selesai ngomong.'
          : analyze.isPending
            ? 'Proses biasanya 5-10 detik.'
            : 'Contoh: "Tadi gue makan nasi padang sama rendang"'}
      </Text>

      <Pressable
        onPress={rec.isRecording ? stop : start}
        disabled={rec.preparing || analyze.isPending}
        style={({ pressed }) => ({
          marginTop: 24,
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: rec.isRecording ? '#ef4444' : '#818cf8',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed || rec.preparing || analyze.isPending ? 0.75 : 1,
          shadowColor: rec.isRecording ? '#ef4444' : '#818cf8',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isActive ? 0.45 : 0.2,
          shadowRadius: 16,
          elevation: 8,
        })}
      >
        {analyze.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : rec.isRecording ? (
          <Square size={28} color="#fff" fill="#fff" />
        ) : (
          <Mic size={32} color="#fff" />
        )}
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

  return (
    <View style={{ borderRadius: 28, backgroundColor: c.card, padding: 20, gap: 12 }}>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', color: c.textSub }}>
        Input manual
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nama makanan"
        placeholderTextColor={c.textSub}
        style={{ borderRadius: 14, backgroundColor: c.cardAlt, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: c.text }}
      />
      <TextInput
        value={calories}
        onChangeText={setCalories}
        placeholder="Kalori (kkal)"
        placeholderTextColor={c.textSub}
        keyboardType="number-pad"
        style={{ borderRadius: 14, backgroundColor: c.cardAlt, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: c.text }}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: 'Protein', val: protein, set: setProtein },
          { label: 'Karbo', val: carb, set: setCarb },
          { label: 'Lemak', val: fat, set: setFat },
        ].map((f) => (
          <View key={f.label} style={{ flex: 1 }}>
            <Text style={{ marginBottom: 4, fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: c.textSub, textAlign: 'center' }}>
              {f.label} g
            </Text>
            <TextInput
              value={f.val}
              onChangeText={f.set}
              placeholder="0"
              placeholderTextColor={c.textSub}
              keyboardType="decimal-pad"
              style={{ borderRadius: 14, backgroundColor: c.cardAlt, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: c.text, textAlign: 'center' }}
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
          paddingVertical: 14,
          alignItems: 'center',
          opacity: pressed || create.isPending ? 0.7 : 1,
        })}
      >
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#ffffff' }}>
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
        source: mode === 'foto' ? 'vision' : mode === 'suara' ? 'audio' : 'manual' as FoodLogSource,
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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 }}>
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
