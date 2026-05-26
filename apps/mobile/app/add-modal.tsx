import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Check, ImageIcon, Search, Sparkles, X } from 'lucide-react-native'
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
import type { CreateMealInput, FoodScanItem, MealType } from '@cimeat/types'
import { formatKcal } from '@cimeat/chat-core'
import { ScreenFade } from '~/components/screen-fade'
import { useFoodScan } from '~/hooks/use-food-scan'
import { useFoods } from '~/hooks/use-foods'
import { useLogMeal } from '~/hooks/use-log-meal'
import { apiErrorMessage } from '~/lib/api'
import { useAccentColor } from '~/lib/use-accent-color'

type Tab = 'scan' | 'search' | 'manual'

const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Sarapan' },
  { key: 'lunch', label: 'Siang' },
  { key: 'dinner', label: 'Malam' },
  { key: 'snack', label: 'Camilan' },
]

function nowIso(): string {
  return new Date().toISOString()
}

export default function AddModal() {
  const router = useRouter()
  const accent = useAccentColor()
  const params = useLocalSearchParams<{ tab?: string; mealType?: string }>()
  const initialMeal = (MEAL_TYPES.find((m) => m.key === params.mealType)?.key ??
    'lunch') as MealType
  const [tab, setTab] = useState<Tab>(params.tab === 'scan' ? 'scan' : 'manual')
  const [mealType, setMealType] = useState<MealType>(initialMeal)

  function close() {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/index')
  }

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
          <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Catat makanan
          </Text>
          <Pressable
            onPress={close}
            accessibilityLabel="Tutup"
            className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
          >
            <X size={18} color="#71717a" />
          </Pressable>
        </View>

        <View className="mx-4 mt-1 flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
          {(['scan', 'search', 'manual'] as Tab[]).map((tk) => {
            const active = tab === tk
            const label = tk === 'scan' ? 'Foto' : tk === 'search' ? 'Cari' : 'Manual'
            return (
              <Pressable
                key={tk}
                onPress={() => setTab(tk)}
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
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View className="mt-3 px-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
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
          {tab === 'scan' ? (
            <ScanTab mealType={mealType} accent={accent} onDone={close} />
          ) : tab === 'search' ? (
            <SearchTab mealType={mealType} accent={accent} onDone={close} />
          ) : (
            <ManualTab mealType={mealType} onDone={close} />
          )}
        </KeyboardAvoidingView>
      </ScreenFade>
    </SafeAreaView>
  )
}

// --- Scan tab -------------------------------------------------------------
function ScanTab({
  mealType,
  accent,
  onDone,
}: {
  mealType: MealType
  accent: string
  onDone: () => void
}) {
  const scan = useFoodScan()
  const log = useLogMeal()
  const [preview, setPreview] = useState<string | null>(null)
  const [items, setItems] = useState<FoodScanItem[]>([])

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
      const result = await scan.mutateAsync({
        image: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
      })
      setItems(result.items)
    } catch (err) {
      Alert.alert('Gagal scan', apiErrorMessage(err))
    }
  }

  function updateItem(idx: number, patch: Partial<FoodScanItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  async function confirm() {
    try {
      for (const it of items) {
        const input: CreateMealInput = {
          mealType,
          name: it.name,
          servings: 1,
          calories: it.calories,
          protein: it.protein,
          carb: it.carb,
          fat: it.fat,
          loggedAt: nowIso(),
          source: 'photo',
        }
        await log.mutateAsync(input)
      }
      onDone()
    } catch (err) {
      Alert.alert('Gagal nyimpen', apiErrorMessage(err))
    }
  }

  const total = items.reduce((s, it) => s + it.calories, 0)

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
      {items.length === 0 ? (
        <View className="items-center rounded-card bg-white px-6 py-10 dark:bg-zinc-900">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
            <Camera size={28} color={accent} />
          </View>
          <Text className="mt-4 font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
            Foto makanan lo
          </Text>
          <Text className="mt-1 text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
            Cimeat bakal deteksi item dan estimasi kalorinya otomatis.
          </Text>
          {preview && scan.isPending ? (
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
          <Text className="mb-2 font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Item terdeteksi · {formatKcal(total)}
          </Text>
          {items.map((it, idx) => (
            <View key={idx} className="mb-2 rounded-card bg-white p-4 dark:bg-zinc-900">
              <TextInput
                value={it.name}
                onChangeText={(v) => updateItem(idx, { name: v })}
                className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100"
              />
              <View className="mt-2 flex-row items-center gap-2">
                <Text className="font-sans text-xs text-zinc-400">Kalori</Text>
                <TextInput
                  value={String(it.calories)}
                  onChangeText={(v) => updateItem(idx, { calories: Number(v) || 0 })}
                  keyboardType="number-pad"
                  className="rounded-lg bg-zinc-100 px-3 py-1.5 font-sans text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <Text className="font-sans text-xs text-zinc-400">kkal</Text>
              </View>
            </View>
          ))}
          <Pressable
            onPress={confirm}
            disabled={log.isPending}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
          >
            <Check size={18} color="#fff" />
            <Text className="font-sans text-sm font-semibold text-white">
              {log.isPending ? 'Nyimpen...' : 'Catat semua'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  )
}

// --- Search tab -----------------------------------------------------------
function SearchTab({
  mealType,
  accent,
  onDone,
}: {
  mealType: MealType
  accent: string
  onDone: () => void
}) {
  const [q, setQ] = useState('')
  const foods = useFoods(q)
  const log = useLogMeal()

  async function logFood(
    foodId: string,
    name: string,
    macros: { calories: number; protein: number; carb: number; fat: number },
  ) {
    try {
      const input: CreateMealInput = {
        foodId,
        mealType,
        name,
        servings: 1,
        calories: macros.calories,
        protein: macros.protein,
        carb: macros.carb,
        fat: macros.fat,
        loggedAt: nowIso(),
        source: 'mobile',
      }
      await log.mutateAsync(input)
      onDone()
    } catch (err) {
      Alert.alert('Gagal nyimpen', apiErrorMessage(err))
    }
  }

  return (
    <View className="flex-1 px-4 pt-4">
      <View className="flex-row items-center gap-3 rounded-input bg-white px-4 py-3 dark:bg-zinc-900">
        <Search size={18} color="#a1a1aa" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Cari makanan..."
          placeholderTextColor="#a1a1aa"
          className="flex-1 font-sans text-sm text-zinc-900 dark:text-zinc-100"
          autoFocus
        />
      </View>
      <ScrollView className="mt-3 flex-1" keyboardShouldPersistTaps="handled">
        {foods.data?.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => logFood(f.id, f.name, f)}
            className="mb-2 flex-row items-center justify-between rounded-card bg-white px-4 py-3 active:opacity-70 dark:bg-zinc-900"
          >
            <View className="flex-1">
              <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {f.name}
              </Text>
              <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
                {f.servingLabel}
              </Text>
            </View>
            <Text className="font-display text-sm font-bold text-primary-600 dark:text-primary-300">
              {formatKcal(f.calories)}
            </Text>
          </Pressable>
        ))}
        {foods.data && foods.data.length === 0 ? (
          <View className="items-center py-10">
            <Sparkles size={20} color={accent} />
            <Text className="mt-2 font-sans text-sm text-zinc-400">Gak ketemu. Coba tab Manual.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

// --- Manual tab -----------------------------------------------------------
function ManualTab({ mealType, onDone }: { mealType: MealType; onDone: () => void }) {
  const log = useLogMeal()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carb, setCarb] = useState('')
  const [fat, setFat] = useState('')
  const [servings, setServings] = useState('1')

  async function save() {
    if (!name.trim()) {
      Alert.alert('Nama kosong', 'Isi dulu nama makanannya ya.')
      return
    }
    try {
      const input: CreateMealInput = {
        mealType,
        name: name.trim(),
        servings: Number(servings) || 1,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carb: Number(carb) || 0,
        fat: Number(fat) || 0,
        loggedAt: nowIso(),
        source: 'manual',
      }
      await log.mutateAsync(input)
      onDone()
    } catch (err) {
      Alert.alert('Gagal nyimpen', apiErrorMessage(err))
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
      <Field label="Porsi">
        <TextInput
          value={servings}
          onChangeText={setServings}
          keyboardType="decimal-pad"
          className="rounded-input bg-white px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </Field>
      <Pressable
        onPress={save}
        disabled={log.isPending}
        className="mt-3 items-center rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
      >
        <Text className="font-sans text-sm font-semibold text-white">
          {log.isPending ? 'Nyimpen...' : 'Catat sekarang'}
        </Text>
      </Pressable>
      <Text className="mt-3 text-center font-sans text-xs text-zinc-400">
        Tercatat sebagai {MEAL_TYPES.find((m) => m.key === mealType)?.label}
      </Text>
    </ScrollView>
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
