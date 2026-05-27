import { useState } from 'react'
import { Plus, Sparkles, UtensilsCrossed, X } from 'lucide-react-native'
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

const MODES: { key: EatingMode; label: string; emoji: string }[] = [
  { key: 'hemat', label: 'Hemat', emoji: '💸' },
  { key: 'sehat', label: 'Sehat', emoji: '🥗' },
  { key: 'balanced', label: 'Seimbang', emoji: '⚖️' },
]

export default function RecipeTab() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7F4' }} edges={['top']}>
      <ScreenFade>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 4, paddingTop: 12 }}>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 26, color: '#1A1C1E' }}>
              Resep dari bahan
            </Text>
            <QuotaBadge feature="recipe" />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
            <View style={{ borderRadius: 24, backgroundColor: '#FFFFFF', padding: 16, shadowColor: '#1A1C1E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
              <Text style={{ marginBottom: 8, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8886' }}>
                Bahan yang ada
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Contoh: telur, bayam, nasi..."
                  placeholderTextColor="#8A8886"
                  onSubmitEditing={addIngredient}
                  returnKeyType="done"
                  style={{ flex: 1, borderRadius: 14, backgroundColor: '#F8F7F4', paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1A1C1E' }}
                />
                <Pressable
                  onPress={addIngredient}
                  style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#FF6B35', opacity: pressed ? 0.8 : 1 })}
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
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, backgroundColor: '#FFF3EE', paddingHorizontal: 12, paddingVertical: 6, opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#FF6B35' }}>
                        {ing}
                      </Text>
                      <X size={12} color="#FF6B35" />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <Text style={{ marginBottom: 8, marginTop: 16, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8886' }}>
              Mode
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MODES.map((m) => {
                const active = mode === m.key
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMode(m.key)}
                    style={({ pressed }) => ({
                      flex: 1,
                      alignItems: 'center',
                      borderRadius: 20,
                      backgroundColor: active ? '#FF6B35' : '#FFFFFF',
                      paddingVertical: 14,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                    <Text style={{ marginTop: 4, fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : '#8A8886' }}>
                      {m.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ marginBottom: 6, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8886' }}>
                  Budget (Rp)
                </Text>
                <TextInput
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="opsional"
                  placeholderTextColor="#8A8886"
                  keyboardType="number-pad"
                  style={{ borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1A1C1E' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ marginBottom: 6, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8886' }}>
                  Hindari
                </Text>
                <TextInput
                  value={avoid}
                  onChangeText={setAvoid}
                  placeholder="cabai, santan"
                  placeholderTextColor="#8A8886"
                  style={{ borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1A1C1E' }}
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
                backgroundColor: '#FF6B35',
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
                <Text style={{ marginBottom: 8, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8886' }}>
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
                        backgroundColor: '#FFFFFF',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFF3EE' }}>
                        <UtensilsCrossed size={16} color="#FF6B35" />
                      </View>
                      <Text style={{ flex: 1, fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1A1C1E' }} numberOfLines={1}>
                        {r.title}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#FF6B35' }}>
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

function RecipeResult({ recipe, onLog }: { recipe: RecipeResponse; onLog: () => void }) {
  const n = recipe.nutrition_estimate
  return (
    <View style={{ marginTop: 20, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 16, shadowColor: '#1A1C1E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
      <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 20, color: '#1A1C1E' }}>
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
          backgroundColor: '#FFF3EE',
          paddingVertical: 12,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#FF6B35' }}>
          Catat 1 porsi
        </Text>
      </Pressable>
    </View>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <View style={{ borderRadius: 99, backgroundColor: '#F8F7F4', paddingHorizontal: 12, paddingVertical: 4 }}>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#8A8886' }}>
        {label}
      </Text>
    </View>
  )
}
