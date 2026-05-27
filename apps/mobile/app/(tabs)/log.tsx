import * as ImagePicker from 'expo-image-picker'
import { useNavigation } from 'expo-router'
import {
  Camera,
  Check,
  Mic,
  Square,
  X,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { CreateFoodLogInput, FoodAnalysis, FoodLogSource, MealType } from '@cimeat/types'
import { useAudioRecording } from '~/hooks/use-audio-log'
import { useCreateFoodLog } from '~/hooks/use-food-logs'
import { useAnalyzeAudio, useAnalyzeImage } from '~/hooks/use-food-ai'
import { useSubscription } from '~/hooks/use-subscription'
import { apiErrorMessage, isQuotaExceeded } from '~/lib/api'
import { track } from '~/lib/analytics'
import { useThemeColors } from '~/lib/theme'

type Phase = 'choice' | 'voice' | 'foto-analyzing' | 'voice-analyzing' | 'draft'

type DraftItem = {
  foodName: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  healthScore: number
  estimatedWeightG: number
  mealType: MealType
  previewUri: string | null
  transcript: string | null
  source: FoodLogSource
  rawAnalysis: FoodAnalysis
}

const MEAL_CATS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Sarapan' },
  { key: 'lunch', label: 'Makan Siang' },
  { key: 'dinner', label: 'Makan Malam' },
  { key: 'snack', label: 'Cemilan' },
]

const ANALYZE_STEPS = [
  'Mendeteksi jenis makanan...',
  'Menghitung kalori...',
  'Menganalisis nutrisi makro...',
  'Hampir selesai...',
]

const WAVE_HEIGHTS = [18, 30, 44, 28, 52, 36, 48, 24, 56, 40, 60, 32, 48, 22, 44, 30, 52, 20, 38, 28, 44, 26, 36, 18, 32]

function nowIso() {
  return new Date().toISOString()
}

function defaultMealType(): MealType {
  const h = new Date().getHours()
  if (h < 10) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 20) return 'dinner'
  return 'snack'
}

function WaveBar({ active, delay, maxH, color }: { active: boolean; delay: number; maxH: number; color: string }) {
  const h = useSharedValue(4)

  useEffect(() => {
    if (active) {
      h.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(maxH, { duration: 300 + delay * 0.4 }),
            withTiming(4, { duration: 300 + delay * 0.4 }),
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
  return <Animated.View style={[{ width: 2, borderRadius: 2, backgroundColor: color }, style]} />
}

function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 64, justifyContent: 'center', paddingHorizontal: 12 }}>
      {WAVE_HEIGHTS.map((maxH, i) => (
        <WaveBar key={i} active={active} delay={i * 40} maxH={maxH} color={color} />
      ))}
    </View>
  )
}

export default function LogTab() {
  const c = useThemeColors()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { openPaywall } = useSubscription()

  const analyzeImage = useAnalyzeImage()
  const analyzeAudio = useAnalyzeAudio()
  const createLog = useCreateFoodLog()
  const rec = useAudioRecording()

  const [phase, setPhase] = useState<Phase>('choice')
  const [draft, setDraft] = useState<DraftItem | null>(null)
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [previewUri, setPreviewUri] = useState<string | null>(null)

  const dismiss = () => {
    navigation.navigate('index' as never)
  }

  const handleQuotaError = (err: unknown) => {
    if (isQuotaExceeded(err)) {
      track('quota_blocked')
      Alert.alert('Jatah harian abis', 'Upgrade buat lanjut pakai fitur ini.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Upgrade', onPress: () => void openPaywall() },
      ])
      setPhase('choice')
      return true
    }
    return false
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (phase === 'foto-analyzing' || phase === 'voice-analyzing') {
      interval = setInterval(() => setAnalyzeStep((p) => (p + 1) % ANALYZE_STEPS.length), 1200)
    } else {
      setAnalyzeStep(0)
    }
    return () => clearInterval(interval)
  }, [phase])

  async function handleFoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) {
        const permGallery = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permGallery.granted) {
          Alert.alert('Izin dibutuhkan', 'Cimeat butuh akses kamera atau galeri.')
          return
        }
        const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 })
        const asset = res.assets?.[0]
        if (res.canceled || !asset?.base64) return
        setPreviewUri(asset.uri)
        setPhase('foto-analyzing')
        track('log_food_photo')
        const r = await analyzeImage.mutateAsync({
          image: asset.base64,
          mimeType: asset.mimeType ?? 'image/jpeg',
          mealType: defaultMealType(),
        })
        setDraft(buildDraft(r, asset.uri, null, 'vision'))
        setPhase('draft')
        return
      }
      const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
      const asset = res.assets?.[0]
      if (res.canceled || !asset?.base64) return
      setPreviewUri(asset.uri)
      setPhase('foto-analyzing')
      track('log_food_photo')
      const r = await analyzeImage.mutateAsync({
        image: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
        mealType: defaultMealType(),
      })
      setDraft(buildDraft(r, asset.uri, null, 'vision'))
      setPhase('draft')
    } catch (err) {
      if (!handleQuotaError(err)) {
        Alert.alert('Gagal', apiErrorMessage(err))
        setPhase('choice')
      }
    }
  }

  async function handleVoiceStop() {
    try {
      const clip = await rec.stop()
      if (!clip) return
      setPhase('voice-analyzing')
      track('log_food_audio')
      const r = await analyzeAudio.mutateAsync({ audio: clip.base64, mimeType: clip.mimeType })
      const tx = (r as FoodAnalysis & { transcript?: string }).transcript ?? transcript
      setDraft(buildDraft(r, null, tx || null, 'audio'))
      setPhase('draft')
    } catch (err) {
      if (!handleQuotaError(err)) {
        Alert.alert('Gagal', apiErrorMessage(err))
        setPhase('voice')
      }
    }
  }

  async function handleVoiceStart() {
    try {
      await rec.start()
      setPhase('voice')
    } catch {
      Alert.alert('Izin mikrofon', 'Cimeat butuh akses mikrofon buat catat pakai suara.')
    }
  }

  async function handleSave() {
    if (!draft) return
    try {
      const input: CreateFoodLogInput = {
        source: draft.source,
        mealType: draft.mealType,
        foodName: draft.foodName,
        estimatedWeightG: draft.estimatedWeightG || undefined,
        calories: Math.round(draft.calories),
        proteinG: draft.proteinG,
        carbsG: draft.carbsG,
        fatG: draft.fatG,
        healthScore: draft.healthScore,
        confidenceScore: draft.rawAnalysis.confidence_score,
        note: draft.transcript || undefined,
        eatenAt: nowIso(),
      }
      await createLog.mutateAsync(input)
      setDraft(null)
      setPhase('choice')
      dismiss()
    } catch (err) {
      if (!handleQuotaError(err)) Alert.alert('Gagal', apiErrorMessage(err))
    }
  }

  const paddingTop = insets.top + 8

  if (phase === 'choice') {
    return <ChoiceScreen paddingTop={paddingTop} onFoto={handleFoto} onVoice={handleVoiceStart} onDismiss={dismiss} />
  }

  if (phase === 'voice') {
    return (
      <VoiceScreen
        paddingTop={paddingTop}
        isRecording={rec.isRecording}
        durationSec={rec.durationSec}
        transcript={transcript}
        onTranscript={setTranscript}
        onStop={handleVoiceStop}
        onDismiss={() => {
          rec.stop().catch(() => {})
          setPhase('choice')
        }}
      />
    )
  }

  if (phase === 'foto-analyzing' || phase === 'voice-analyzing') {
    return <AnalyzingScreen paddingTop={paddingTop} step={ANALYZE_STEPS[analyzeStep] ?? ANALYZE_STEPS[0]!} previewUri={phase === 'foto-analyzing' ? previewUri : null} />
  }

  if (phase === 'draft' && draft) {
    return (
      <DraftScreen
        paddingTop={paddingTop}
        draft={draft}
        saving={createLog.isPending}
        onChange={(patch) => setDraft((d) => d ? { ...d, ...patch } : d)}
        onSave={handleSave}
        onDismiss={() => { setDraft(null); setPhase('choice') }}
      />
    )
  }

  return null
}

function buildDraft(r: FoodAnalysis, uri: string | null, transcript: string | null, source: FoodLogSource): DraftItem {
  return {
    foodName: r.food_name,
    calories: r.calories,
    proteinG: r.macronutrients.protein_g,
    carbsG: r.macronutrients.carbs_g,
    fatG: r.macronutrients.fat_g,
    healthScore: r.health_score,
    estimatedWeightG: r.estimated_weight_g || 150,
    mealType: defaultMealType(),
    previewUri: uri,
    transcript,
    source,
    rawAnalysis: r,
  }
}

function ChoiceScreen({
  paddingTop,
  onFoto,
  onVoice,
  onDismiss,
}: {
  paddingTop: number
  onFoto: () => void
  onVoice: () => void
  onDismiss: () => void
}) {
  const c = useThemeColors()
  const cameraScale = useSharedValue(1)
  const micScale = useSharedValue(1)

  const cameraStyle = useAnimatedStyle(() => ({ transform: [{ scale: cameraScale.value }] }))
  const micStyle = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }))

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: c.text }}>Catat makanan</Text>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.cardAlt,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <X size={18} color={c.textSub} />
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, gap: 12 }}>
        <Pressable
          onPressIn={() => { cameraScale.value = withSpring(0.97, { damping: 12 }) }}
          onPressOut={() => { cameraScale.value = withSpring(1, { damping: 10 }) }}
          onPress={onFoto}
          style={{ flex: 1 }}
        >
          <Animated.View style={[{
            flex: 1,
            borderRadius: 32,
            backgroundColor: '#FF6B35',
            overflow: 'hidden',
            justifyContent: 'flex-end',
            padding: 28,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 10,
          }, cameraStyle]}>
            <View style={{ position: 'absolute', top: -20, right: -20, opacity: 0.12 }}>
              <Camera size={160} color="#ffffff" />
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Camera size={22} color="#ffffff" />
            </View>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: '#ffffff', lineHeight: 24 }}>
              Scan AI
            </Text>
            <Text style={{ marginTop: 6, fontFamily: 'Outfit_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 }}>
              Foto makanan & deteksi instan
            </Text>
          </Animated.View>
        </Pressable>

        <Pressable
          onPressIn={() => { micScale.value = withSpring(0.97, { damping: 12 }) }}
          onPressOut={() => { micScale.value = withSpring(1, { damping: 10 }) }}
          onPress={onVoice}
          style={{ flex: 1 }}
        >
          <Animated.View style={[{
            flex: 1,
            borderRadius: 32,
            backgroundColor: c.card,
            justifyContent: 'flex-end',
            padding: 28,
            borderWidth: 1.5,
            borderColor: c.border,
            shadowColor: c.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 3,
          }, micStyle]}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.cardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Mic size={22} color={c.orange} />
            </View>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: c.text, lineHeight: 24 }}>
              Voice Log
            </Text>
            <Text style={{ marginTop: 6, fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub, lineHeight: 18 }}>
              Sebut aja makanan lo langsung
            </Text>
          </Animated.View>
        </Pressable>
      </View>

      <View style={{ height: 120 }} />
    </View>
  )
}

function VoiceScreen({
  paddingTop,
  isRecording,
  durationSec,
  transcript,
  onTranscript: _onTranscript,
  onStop,
  onDismiss,
}: {
  paddingTop: number
  isRecording: boolean
  durationSec: number
  transcript: string
  onTranscript: (t: string) => void
  onStop: () => void
  onDismiss: () => void
}) {
  const c = useThemeColors()
  const btnScale = useSharedValue(1)
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }))

  const pressStop = () => {
    btnScale.value = withSequence(withSpring(0.86, { damping: 10 }), withSpring(1, { damping: 12 }))
    onStop()
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop, alignItems: 'center' }}>
      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: c.text }}>Voice Log</Text>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.cardAlt,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <X size={18} color={c.textSub} />
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32, paddingHorizontal: 28 }}>
        <Waveform active={isRecording} color="#818cf8" />

        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 20, color: c.text, textAlign: 'center' }}>
            {isRecording
              ? transcript || 'Sebutkan makananmu...'
              : 'Tap tombol untuk mulai'}
          </Text>
          {isRecording ? (
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: '#818cf8', opacity: 0.7 }}>
              Merekam · {durationSec}s
            </Text>
          ) : null}
        </View>

        <Pressable onPress={pressStop} disabled={!isRecording}>
          <Animated.View style={[{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: isRecording ? '#ef4444' : '#818cf8',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: isRecording ? '#ef4444' : '#818cf8',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 16,
            elevation: 10,
            opacity: isRecording ? 1 : 0.5,
          }, btnStyle]}>
            {isRecording ? (
              <Square size={28} color="#fff" fill="#fff" />
            ) : (
              <Mic size={32} color="#fff" />
            )}
          </Animated.View>
        </Pressable>
      </View>

      <View style={{ height: 120 }} />
    </View>
  )
}

function AnalyzingScreen({
  paddingTop,
  step,
  previewUri,
}: {
  paddingTop: number
  step: string
  previewUri: string | null
}) {
  const c = useThemeColors()
  const dotsOpacity = useSharedValue(0.3)

  useEffect(() => {
    dotsOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })),
      -1,
      false,
    )
  }, [dotsOpacity])

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotsOpacity.value }))

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 }}>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={{ width: '100%', height: 180, borderRadius: 24 }} resizeMode="cover" />
      ) : (
        <Waveform active color="#818cf8" />
      )}

      <ActivityIndicator size="large" color={c.orange} />

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Animated.Text style={[{
          fontFamily: 'Outfit_700Bold',
          fontSize: 14,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: c.orange,
        }, dotStyle]}>
          {step}
        </Animated.Text>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub, textAlign: 'center' }}>
          Cimit lagi nganalisa makanan lo...
        </Text>
      </View>
    </View>
  )
}

function DraftScreen({
  paddingTop,
  draft,
  saving,
  onChange,
  onSave,
  onDismiss,
}: {
  paddingTop: number
  draft: DraftItem
  saving: boolean
  onChange: (patch: Partial<DraftItem>) => void
  onSave: () => void
  onDismiss: () => void
}) {
  const c = useThemeColors()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop, paddingHorizontal: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 24, color: c.text }}>Hasil Analisa AI</Text>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.cardAlt,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <X size={18} color={c.textSub} />
        </Pressable>
      </View>

      <View style={{ borderRadius: 32, backgroundColor: c.card, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 }}>
        {draft.previewUri ? (
          <Image source={{ uri: draft.previewUri }} style={{ width: '100%', height: 160, backgroundColor: c.cardAlt }} resizeMode="cover" />
        ) : (
          <View style={{ height: 80, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center' }}>
            <Waveform active={false} color="#818cf8" />
          </View>
        )}

        <View style={{ padding: 24, gap: 20 }}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <TextInput
              value={draft.foodName}
              onChangeText={(t) => onChange({ foodName: t })}
              style={{
                fontFamily: 'Outfit_900Black',
                fontSize: 22,
                color: c.text,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                paddingVertical: 4,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                width: '100%',
              }}
              placeholderTextColor={c.textSub}
            />
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 40, color: c.orange, letterSpacing: -1 }}>
              {Math.round(draft.calories)}
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.textSub }}> kkal</Text>
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <MacroBox label="Protein" value={draft.proteinG} color="#22C55E" />
            <MacroBox label="Karbo" value={draft.carbsG} color="#F59E0B" />
            <MacroBox label="Lemak" value={draft.fatG} color="#EF4444" />
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
              Kategori
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MEAL_CATS.map((cat) => {
                const active = draft.mealType === cat.key
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => onChange({ mealType: cat.key })}
                    style={({ pressed }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 99,
                      backgroundColor: active ? c.orange : c.cardAlt,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: active ? '#ffffff' : c.textSub }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {draft.transcript ? (
            <View style={{ borderRadius: 16, backgroundColor: c.cardAlt, padding: 14 }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: c.textSub, marginBottom: 6 }}>
                Transcript Suara
              </Text>
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.text, lineHeight: 20, fontStyle: 'italic' }}>
                &ldquo;{draft.transcript}&rdquo;
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onSave}
        disabled={saving}
        style={({ pressed }) => ({
          marginTop: 16,
          borderRadius: 99,
          backgroundColor: c.orange,
          paddingVertical: 18,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
          opacity: pressed || saving ? 0.8 : 1,
          shadowColor: c.orange,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        })}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Check size={20} color="#ffffff" />
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 16, color: '#ffffff', letterSpacing: 0.3 }}>
              Simpan ke Riwayat
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  )
}

function MacroBox({ label, value, color }: { label: string; value: number; color: string }) {
  const c = useThemeColors()
  return (
    <View style={{ flex: 1, borderRadius: 16, backgroundColor: c.cardAlt, padding: 12, alignItems: 'center', gap: 4 }}>
      <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, color }}>{Math.round(value)}</Text>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>{label} g</Text>
    </View>
  )
}
