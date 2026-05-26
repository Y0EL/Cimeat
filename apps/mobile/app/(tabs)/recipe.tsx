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
import { CimitMascot } from '~/components/cimit/cimit-mascot'
import { TtsButton } from '~/components/cimit/tts-button'
import { QuotaBadge } from '~/components/quota-badge'
import { ScreenFade } from '~/components/screen-fade'
import { MarkdownText } from '~/components/markdown-text'
import { useCreateFoodLog } from '~/hooks/use-food-logs'
import { useGenerateRecipe, useSavedRecipes } from '~/hooks/use-recipe-generate'
import { useSubscription } from '~/hooks/use-subscription'
import { apiErrorMessage, isQuotaExceeded } from '~/lib/api'
import { track } from '~/lib/analytics'
import { useAccentColor } from '~/lib/use-accent-color'

const MODES: { key: EatingMode; label: string; emoji: string }[] = [
  { key: 'hemat', label: 'Hemat', emoji: '💸' },
  { key: 'sehat', label: 'Sehat', emoji: '🥗' },
  { key: 'balanced', label: 'Seimbang', emoji: '⚖️' },
]

export default function RecipeTab() {
  const accent = useAccentColor()
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
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="flex-row items-center justify-between px-4 pb-1 pt-2">
            <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Resep dari bahan
            </Text>
            <QuotaBadge feature="recipe" />
          </View>

          <ScrollView className="flex-1" contentContainerClassName="px-4 pb-32 pt-3" keyboardShouldPersistTaps="handled">
            <View className="rounded-card bg-white p-4 dark:bg-zinc-900">
              <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Bahan yang ada
              </Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Contoh: telur, bayam, nasi..."
                  placeholderTextColor="#a1a1aa"
                  onSubmitEditing={addIngredient}
                  returnKeyType="done"
                  className="flex-1 rounded-input bg-zinc-100 px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <Pressable
                  onPress={addIngredient}
                  className="h-11 w-11 items-center justify-center rounded-full bg-primary-600 active:opacity-80"
                >
                  <Plus size={20} color="#fff" />
                </Pressable>
              </View>
              {ingredients.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <Pressable
                      key={ing}
                      onPress={() => removeIngredient(ing)}
                      className="flex-row items-center gap-1 rounded-full bg-primary-100 px-3 py-1.5 active:opacity-70 dark:bg-primary-950"
                    >
                      <Text className="font-sans text-xs font-semibold text-primary-700 dark:text-primary-300">
                        {ing}
                      </Text>
                      <X size={12} color="#ea580c" />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <Text className="mb-2 mt-4 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Mode
            </Text>
            <View className="flex-row gap-2">
              {MODES.map((m) => {
                const active = mode === m.key
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMode(m.key)}
                    className={
                      active
                        ? 'flex-1 items-center rounded-2xl bg-primary-600 py-3'
                        : 'flex-1 items-center rounded-2xl bg-white py-3 dark:bg-zinc-900'
                    }
                  >
                    <Text className="text-lg">{m.emoji}</Text>
                    <Text
                      className={
                        active
                          ? 'mt-1 font-sans text-xs font-semibold text-white'
                          : 'mt-1 font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                      }
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Budget (Rp)
                </Text>
                <TextInput
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="opsional"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="number-pad"
                  className="rounded-input bg-white px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Hindari
                </Text>
                <TextInput
                  value={avoid}
                  onChangeText={setAvoid}
                  placeholder="cabai, santan"
                  placeholderTextColor="#a1a1aa"
                  className="rounded-input bg-white px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </View>
            </View>

            <Pressable
              onPress={run}
              disabled={generate.isPending}
              className="mt-4 flex-row items-center justify-center gap-2 rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
            >
              {generate.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Sparkles size={18} color="#fff" />
                  <Text className="font-sans text-sm font-semibold text-white">Bikinin resep</Text>
                </>
              )}
            </Pressable>

            {result ? <RecipeResult recipe={result} onLog={() => logPerServing(result)} /> : null}

            {saved.data && saved.data.length > 0 ? (
              <View className="mt-6">
                <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Resep tersimpan
                </Text>
                <View className="gap-2">
                  {saved.data.map((r, i) => (
                    <Pressable
                      key={r.id ?? `${r.title}-${i}`}
                      onPress={() => setResult(r)}
                      className="flex-row items-center gap-3 rounded-card bg-white px-4 py-3 active:opacity-70 dark:bg-zinc-900"
                    >
                      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
                        <UtensilsCrossed size={16} color={accent} />
                      </View>
                      <Text className="flex-1 font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100" numberOfLines={1}>
                        {r.title}
                      </Text>
                      <Text className="font-display text-xs font-bold text-primary-600 dark:text-primary-300">
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
    <View className="mt-5 rounded-card bg-white p-4 dark:bg-zinc-900">
      <Text className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
        {recipe.title}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        <Pill label={`${formatKcal(n.calories)} total`} />
        <Pill label={`${Math.round(n.protein_g)}g protein`} />
        <Pill label={`${Math.round(n.carbs_g)}g karbo`} />
        <Pill label={`${Math.round(n.fat_g)}g lemak`} />
        <Pill label={`${n.servings} porsi`} />
      </View>

      <MarkdownText text={recipe.recipe_markdown} className="mt-3" />

      {recipe.cimit_message ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-2xl bg-primary-50 px-3 py-2.5 dark:bg-primary-950">
          <CimitMascot size={32} />
          <Text className="flex-1 font-sans text-sm leading-5 text-zinc-700 dark:text-zinc-200">
            {recipe.cimit_message}
          </Text>
          <TtsButton text={recipe.cimit_message} size={16} />
        </View>
      ) : null}

      <Pressable
        onPress={onLog}
        className="mt-3 items-center rounded-full bg-primary-100 py-3 active:opacity-70 dark:bg-primary-950"
      >
        <Text className="font-sans text-sm font-semibold text-primary-700 dark:text-primary-300">
          Catat 1 porsi
        </Text>
      </Pressable>
    </View>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
      <Text className="font-sans text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
        {label}
      </Text>
    </View>
  )
}
