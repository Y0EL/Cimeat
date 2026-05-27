import { useEffect, useState } from 'react'
import { Banknote, Leaf, Plus, Salad, Scale, Sparkles, UtensilsCrossed, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CreateFoodLogInput, EatingMode, RecipeResponse } from '@cimeat/types'
import { formatKcal } from '@cimeat/chat-core'
import { TtsButton } from '~/components/cimit/tts-button'
import { QuotaBadge } from '~/components/quota-badge'
import { ScreenFade } from '~/components/screen-fade'
import { MarkdownText } from '~/components/markdown-text'
import { useCreateFoodLog } from '~/hooks/use-food-logs'
import { useGenerateRecipe, useSavedRecipes } from '~/hooks/use-recipe-generate'
import { useSubscription } from '~/hooks/use-subscription'
import { apiErrorMessage, isQuotaExceeded } from '~/lib/api'
import { track } from '~/lib/analytics'
import { useThemeColors } from '~/lib/theme'

type ModeItem = { key: EatingMode; label: string; Icon: typeof Banknote; color: string }

const MODES: ModeItem[] = [
  { key: 'hemat', label: 'Hemat', Icon: Banknote, color: '#f59e0b' },
  { key: 'sehat', label: 'Sehat', Icon: Salad, color: '#22C55E' },
  { key: 'balanced', label: 'Seimbang', Icon: Scale, color: '#818cf8' },
]

export default function RecipeTab() {
  const c = useThemeColors()
  const generate = useGenerateRecipe()
  const saved = useSavedRecipes()
  const create = useCreateFoodLog()
  const { openPaywall } = useSubscription()

  const [ingredients, setIngredients] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [mode, setMode] = useState<EatingMode>('balanced')
  const [budget, setBudget] = useState('')
  const [avoid, setAvoid] = useState('')
  const [result, setResult] = useState<RecipeResponse | null>(null)

  function addIngredient() {
    const v = draft.trim()
    if (!v) return
    setIngredients((prev) => (prev.includes(v) ? prev : [...prev, v]))
    setDraft('')
  }

  function removeIngredient(v: string) {
    setIngredients((prev) => prev.filter((i) => i !== v))
  }

  async function run() {
    if (ingredients.length === 0) {
      Alert.alert('Bahan kosong', 'Tambah minimal satu bahan dulu ya.')
      return
    }
    try {
      track('recipe_generate', { mode })
      const input = {
        ingredients,
        mode,
        ...(Number(budget) > 0 ? { budget: Number(budget) } : {}),
        ...(avoid.trim() ? { avoid: avoid.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      }
      const r = await generate.mutateAsync(input)
      setResult(r)
      saved.refetch()
    } catch (err) {
      if (isQuotaExceeded(err)) {
        track('quota_blocked')
        Alert.alert('Jatah resep abis', 'Upgrade buat bikin resep lebih banyak.', [
          { text: 'Nanti', style: 'cancel' },
          { text: 'Upgrade', onPress: () => void openPaywall() },
        ])
        return
      }
      Alert.alert('Gagal', apiErrorMessage(err))
    }
  }

  async function logPerServing(r: RecipeResponse) {
    const n = r.nutrition_estimate
    const servings = n.servings || 1
    try {
      const input: CreateFoodLogInput = {
        source: 'recipe',
        foodName: `${r.title} (1 porsi)`,
        calories: Math.round(n.calories / servings),
        proteinG: n.protein_g / servings,
        carbsG: n.carbs_g / servings,
        fatG: n.fat_g / servings,
        eatenAt: new Date().toISOString(),
      }
      await create.mutateAsync(input)
      Alert.alert('Tercatat', '1 porsi udah masuk catatan lo.')
    } catch (err) {
      Alert.alert('Gagal', apiErrorMessage(err))
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScreenFade>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 4, paddingTop: 12 }}>
            <View>
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: c.textSub }}>Dapur digital</Text>
              <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: c.text }}>
                Resep dari bahan
              </Text>
            </View>
            <QuotaBadge feature="recipe" />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
            <View style={{ borderRadius: 24, backgroundColor: c.card, padding: 16, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
              <Text style={{ marginBottom: 8, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
                Bahan yang ada
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Contoh: telur, bayam, nasi..."
                  placeholderTextColor={c.textSub}
                  onSubmitEditing={addIngredient}
                  returnKeyType="done"
                  style={{ flex: 1, borderRadius: 14, backgroundColor: c.cardAlt, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: c.text }}
                />
                <Pressable
                  onPress={addIngredient}
                  style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: c.orange, opacity: pressed ? 0.8 : 1 })}
                >
                  <Plus size={20} color="#fff" />
                </Pressable>
              </View>
              {ingredients.length > 0 ? (
                <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {ingredients.map((ing) => (
                    <Pressable
                      key={ing}
                      onPress={() => removeIngredient(ing)}
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, backgroundColor: c.orangeSoft, paddingHorizontal: 12, paddingVertical: 6, opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 12, color: c.orange }}>
                        {ing}
                      </Text>
                      <X size={12} color={c.orange} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <Text style={{ marginBottom: 8, marginTop: 16, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
              Mode
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MODES.map((m) => (
                <AnimatedModeButton
                  key={m.key}
                  item={m}
                  active={mode === m.key}
                  onPress={() => setMode(m.key)}
                />
              ))}
            </View>

            <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ marginBottom: 6, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
                  Budget (Rp)
                </Text>
                <TextInput
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="opsional"
                  placeholderTextColor={c.textSub}
                  keyboardType="number-pad"
                  style={{ borderRadius: 14, backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: c.text }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ marginBottom: 6, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
                  Hindari
                </Text>
                <TextInput
                  value={avoid}
                  onChangeText={setAvoid}
                  placeholder="cabai, santan"
                  placeholderTextColor={c.textSub}
                  style={{ borderRadius: 14, backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: c.text }}
                />
              </View>
            </View>

            <Pressable
              onPress={run}
              disabled={generate.isPending}
              style={({ pressed }) => ({
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 99,
                backgroundColor: c.orange,
                paddingVertical: 14,
                opacity: pressed || generate.isPending ? 0.7 : 1,
              })}
            >
              {generate.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Sparkles size={18} color="#fff" />
                  <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>Bikinin resep</Text>
                </>
              )}
            </Pressable>

            {result ? <RecipeResult recipe={result} onLog={() => logPerServing(result)} /> : null}

            {saved.data && saved.data.length > 0 ? (
              <View style={{ marginTop: 24 }}>
                <Text style={{ marginBottom: 8, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.textSub }}>
                  Resep tersimpan
                </Text>
                <View style={{ gap: 8 }}>
                  {saved.data.map((r, i) => (
                    <Pressable
                      key={r.id ?? `${r.title}-${i}`}
                      onPress={() => setResult(r)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 20,
                        backgroundColor: c.card,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: c.orangeSoft }}>
                        <UtensilsCrossed size={16} color={c.orange} />
                      </View>
                      <Text style={{ flex: 1, fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.text }} numberOfLines={1}>
                        {r.title}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: c.orange }}>
                        {formatKcal(r.nutrition_estimate.calories)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function AnimatedModeButton({ item, active, onPress }: { item: ModeItem; active: boolean; onPress: () => void }) {
  const c = useThemeColors()
  const iconScale = useSharedValue(1)
  const cardScale = useSharedValue(1)

  useEffect(() => {
    if (active) {
      iconScale.value = withSequence(
        withSpring(1.5, { damping: 5, stiffness: 450 }),
        withSpring(1, { damping: 12 }),
      )
      cardScale.value = withSequence(
        withSpring(0.94, { damping: 10 }),
        withSpring(1, { damping: 12 }),
      )
    }
  }, [active, iconScale, cardScale])

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }))
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }))

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.9 : 1 })}>
      <Animated.View style={[{ alignItems: 'center', borderRadius: 20, backgroundColor: active ? item.color : c.card, paddingVertical: 14 }, cardStyle]}>
        <Animated.View style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: active ? 'rgba(255,255,255,0.2)' : c.cardAlt, alignItems: 'center', justifyContent: 'center' }, iconStyle]}>
          <item.Icon size={18} color={active ? '#ffffff' : c.textSub} />
        </Animated.View>
        <Text style={{ marginTop: 6, fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : c.textSub }}>
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

function RecipeResult({ recipe, onLog }: { recipe: RecipeResponse; onLog: () => void }) {
  const c = useThemeColors()
  const n = recipe.nutrition_estimate
  return (
    <View style={{ marginTop: 20, borderRadius: 24, backgroundColor: c.card, padding: 16, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
      <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 20, color: c.text }}>
        {recipe.title}
      </Text>
      <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pill label={`${formatKcal(n.calories)} total`} />
        <Pill label={`${Math.round(n.protein_g)}g protein`} />
        <Pill label={`${Math.round(n.carbs_g)}g karbo`} />
        <Pill label={`${Math.round(n.fat_g)}g lemak`} />
        <Pill label={`${n.servings} porsi`} />
      </View>

      <MarkdownText text={recipe.recipe_markdown} className="mt-3" />

      {recipe.cimit_message ? (
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 20, backgroundColor: '#2A2D30', paddingHorizontal: 14, paddingVertical: 12 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} color="#ffffff" />
          </View>
          <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 20, color: '#F8F7F4' }}>
            {recipe.cimit_message}
          </Text>
          <TtsButton text={recipe.cimit_message} size={16} />
        </View>
      ) : null}

      <Pressable
        onPress={onLog}
        style={({ pressed }) => ({
          marginTop: 12,
          alignItems: 'center',
          borderRadius: 99,
          backgroundColor: c.orangeSoft,
          paddingVertical: 12,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.orange }}>
          Catat 1 porsi
        </Text>
      </Pressable>
    </View>
  )
}

function Pill({ label }: { label: string }) {
  const c = useThemeColors()
  return (
    <View style={{ borderRadius: 99, backgroundColor: c.cardAlt, paddingHorizontal: 12, paddingVertical: 4 }}>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: c.textSub }}>
        {label}
      </Text>
    </View>
  )
}
