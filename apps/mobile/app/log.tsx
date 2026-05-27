import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
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
  StyleSheet,
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

function WaveBar({ active, delay, maxH }: { active: boolean; delay: number; maxH: number }) {
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
  return <Animated.View style={[{ width: 2, borderRadius: 2, backgroundColor: '#818cf8' }, style]} />
}

function Waveform({ active }: { active: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 64, justifyContent: 'center', paddingHorizontal: 12 }}>
      {WAVE_HEIGHTS.map((maxH, i) => (
        <WaveBar key={i} active={active} delay={i * 40} maxH={maxH} />
      ))}
    </View>
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

export default function LogModal() {
  const c = useThemeColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { openPaywall } = useSubscription()

  const analyzeImage = useAnalyzeImage()
  const analyzeAudio = useAnalyzeAudio()
  const createLog = useCreateFoodLog()
  const rec = useAudioRecording()

  const [phase, setPhase] = useState<Phase>('choice')
  const [draft, setDraft] = useState<DraftItem | null>(null)
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const [previewUri, setPreviewUri] = useState<string | null>(null)

  const dismiss = () => router.back()

  const handleQuotaError = (err: unknown): boolean => {
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
      const permCam = await ImagePicker.requestCameraPermissionsAsync()
      const res = permCam.granted
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
        : await (async () => {
            const permLib = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (!permLib.granted) {
              Alert.alert('Izin dibutuhkan', 'Cimeat butuh akses kamera atau galeri.')
              return null
            }
            return ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 })
          })()
      if (!res) return
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

  async function handleVoiceStart() {
    try {
      await rec.start()
      setPhase('voice')
    } catch {
      Alert.alert('Izin mikrofon', 'Cimeat butuh akses mikrofon buat catat pakai suara.')
    }
  }

  async function handleVoiceStop() {
    try {
      const clip = await rec.stop()
      if (!clip) return
      setPhase('voice-analyzing')
      track('log_food_audio')
      const r = await analyzeAudio.mutateAsync({ audio: clip.base64, mimeType: clip.mimeType })
      const tx = (r as FoodAnalysis & { transcript?: string }).transcript ?? ''
      setDraft(buildDraft(r, null, tx || null, 'audio'))
      setPhase('draft')
    } catch (err) {
      if (!handleQuotaError(err)) {
        Alert.alert('Gagal', apiErrorMessage(err))
        setPhase('voice')
      }
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
      dismiss()
    } catch (err) {
      if (!handleQuotaError(err)) Alert.alert('Gagal', apiErrorMessage(err))
    }
  }

  const sheetBg = c.card
  const handleBack = phase === 'choice' ? dismiss : () => {
    if (phase === 'voice') rec.stop().catch(() => {})
    setPhase('choice')
  }

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleBack} />

      <Animated.View
        style={{
          backgroundColor: sheetBg,
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          paddingBottom: Math.max(insets.bottom, 20) + 8,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 14, marginBottom: 4 }} />

        {phase === 'choice' && (
          <ChoiceContent
            onFoto={handleFoto}
            onVoice={handleVoiceStart}
            onDismiss={dismiss}
          />
        )}

        {phase === 'voice' && (
          <VoiceContent
            isRecording={rec.isRecording}
            durationSec={rec.durationSec}
            onStop={handleVoiceStop}
            onDismiss={() => { rec.stop().catch(() => {}); setPhase('choice') }}
          />
        )}

        {(phase === 'foto-analyzing' || phase === 'voice-analyzing') && (
          <AnalyzingContent
            step={ANALYZE_STEPS[analyzeStep] ?? ANALYZE_STEPS[0]!}
            previewUri={phase === 'foto-analyzing' ? previewUri : null}
          />
        )}

        {phase === 'draft' && draft && (
          <DraftContent
            draft={draft}
            saving={createLog.isPending}
            onChange={(patch) => setDraft((d) => d ? { ...d, ...patch } : d)}
            onSave={handleSave}
            onDismiss={() => { setDraft(null); setPhase('choice') }}
          />
        )}
      </Animated.View>
    </View>
  )
}

function ChoiceContent({
  onFoto,
  onVoice,
  onDismiss,
}: {
  onFoto: () => void
  onVoice: () => void
  onDismiss: () => void
}) {
  const c = useThemeColors()
  const camScale = useSharedValue(1)
  const micScale = useSharedValue(1)
  const camStyle = useAnimatedStyle(() => ({ transform: [{ scale: camScale.value }] }))
  const micStyle = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }))

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: c.text }}>Catat makanan</Text>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 17, backgroundColor: c.cardAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
        >
          <X size={16} color={c.textSub} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, height: 200 }}>
        <Pressable
          onPressIn={() => { camScale.value = withSpring(0.96, { damping: 12 }) }}
          onPressOut={() => { camScale.value = withSpring(1, { damping: 10 }) }}
          onPress={onFoto}
          style={{ flex: 1 }}
        >
          <Animated.View style={[{
            flex: 1,
            borderRadius: 28,
            backgroundColor: '#FF6B35',
            overflow: 'hidden',
            justifyContent: 'flex-end',
            padding: 22,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 8,
          }, camStyle]}>
            <View style={{ position: 'absolute', top: -16, right: -16, opacity: 0.12 }}>
              <Camera size={130} color="#ffffff" />
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Camera size={20} color="#ffffff" />
            </View>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, color: '#ffffff', lineHeight: 20 }}>Scan AI</Text>
            <Text style={{ marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 16 }}>
              Foto & deteksi instan
            </Text>
          </Animated.View>
        </Pressable>

        <Pressable
          onPressIn={() => { micScale.value = withSpring(0.96, { damping: 12 }) }}
          onPressOut={() => { micScale.value = withSpring(1, { damping: 10 }) }}
          onPress={onVoice}
          style={{ flex: 1 }}
        >
          <Animated.View style={[{
            flex: 1,
            borderRadius: 28,
            backgroundColor: c.cardAlt,
            justifyContent: 'flex-end',
            padding: 22,
            borderWidth: 1.5,
            borderColor: c.border,
          }, micStyle]}>
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Mic size={20} color="#818cf8" />
            </View>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, color: c.text, lineHeight: 20 }}>Voice Log</Text>
            <Text style={{ marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 12, color: c.textSub, lineHeight: 16 }}>
              Sebut aja makanan lo
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  )
}

function VoiceContent({
  isRecording,
  durationSec,
  onStop,
  onDismiss,
}: {
  isRecording: boolean
  durationSec: number
  onStop: () => void
  onDismiss: () => void
}) {
  const c = useThemeColors()
  const btnScale = useSharedValue(1)
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }))

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: c.text }}>Voice Log</Text>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 17, backgroundColor: c.cardAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
        >
          <X size={16} color={c.textSub} />
        </Pressable>
      </View>

      <View style={{ alignItems: 'center', gap: 24, paddingVertical: 8 }}>
        <Waveform active={isRecording} />

        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, color: c.text, textAlign: 'center' }}>
            {isRecording ? `Merekam · ${durationSec}s` : 'Tap tombol untuk mulai'}
          </Text>
          {isRecording ? (
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#818cf8', letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.8 }}>
              Mendengarkan
            </Text>
          ) : null}
        </View>

        <Pressable
          onPressIn={() => { btnScale.value = withSpring(0.88, { damping: 10 }) }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }) }}
          onPress={isRecording ? onStop : undefined}
          disabled={!isRecording}
        >
          <Animated.View style={[{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: isRecording ? '#ef4444' : '#818cf8',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: isRecording ? '#ef4444' : '#818cf8',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 16,
            elevation: 10,
            opacity: isRecording ? 1 : 0.45,
          }, btnStyle]}>
            {isRecording ? <Square size={28} color="#fff" fill="#fff" /> : <Mic size={32} color="#fff" />}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  )
}

function AnalyzingContent({
  step,
  previewUri,
}: {
  step: string
  previewUri: string | null
}) {
  const c = useThemeColors()
  const pulse = useSharedValue(0.4)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.4, { duration: 600 })),
      -1,
      false,
    )
  }, [pulse])

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, alignItems: 'center', gap: 20 }}>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={{ width: '100%', height: 160, borderRadius: 24 }} resizeMode="cover" />
      ) : (
        <View style={{ paddingVertical: 16 }}>
          <Waveform active />
        </View>
      )}
      <ActivityIndicator size="large" color={c.orange} />
      <Animated.Text style={[{ fontFamily: 'Outfit_700Bold', fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: c.orange }, pulseStyle]}>
        {step}
      </Animated.Text>
    </View>
  )
}

function DraftContent({
  draft,
  saving,
  onChange,
  onSave,
  onDismiss,
}: {
  draft: DraftItem
  saving: boolean
  onChange: (patch: Partial<DraftItem>) => void
  onSave: () => void
  onDismiss: () => void
}) {
  const c = useThemeColors()

  return (
    <ScrollView
      style={{ maxHeight: 560 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: c.text }}>Hasil Analisa AI</Text>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 17, backgroundColor: c.cardAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
        >
          <X size={16} color={c.textSub} />
        </Pressable>
      </View>

      {draft.previewUri ? (
        <Image source={{ uri: draft.previewUri }} style={{ width: '100%', height: 140, borderRadius: 24, marginBottom: 16 }} resizeMode="cover" />
      ) : (
        <View style={{ height: 70, marginBottom: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Waveform active={false} />
        </View>
      )}

      <View style={{ alignItems: 'center', gap: 4, marginBottom: 20 }}>
        <TextInput
          value={draft.foodName}
          onChangeText={(t) => onChange({ foodName: t })}
          style={{
            fontFamily: 'Outfit_900Black',
            fontSize: 20,
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
        <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 38, color: c.orange, letterSpacing: -1 }}>
          {Math.round(draft.calories)}
          <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.textSub }}> kkal</Text>
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <MacroBox label="Protein" value={draft.proteinG} color="#22C55E" />
        <MacroBox label="Karbo" value={draft.carbsG} color="#F59E0B" />
        <MacroBox label="Lemak" value={draft.fatG} color="#EF4444" />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub, marginBottom: 10 }}>
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
        <View style={{ borderRadius: 16, backgroundColor: c.cardAlt, padding: 14, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: c.textSub, marginBottom: 6 }}>
            Transcript
          </Text>
          <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.text, lineHeight: 20, fontStyle: 'italic' }}>
            &ldquo;{draft.transcript}&rdquo;
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onSave}
        disabled={saving}
        style={({ pressed }) => ({
          borderRadius: 99,
          backgroundColor: c.orange,
          paddingVertical: 17,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
          opacity: pressed || saving ? 0.8 : 1,
          shadowColor: '#FF6B35',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        })}
      >
        {saving ? <ActivityIndicator color="#fff" /> : (
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
