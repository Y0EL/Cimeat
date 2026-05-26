import { useRouter } from 'expo-router'
import { ChevronLeft, Heart, Pencil, Plus, Trash2, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CreateFoodInput, FoodCategory, FoodDto } from '@cimeat/types'
import { formatKcal } from '@cimeat/chat-core'
import { ScreenFade } from '~/components/screen-fade'
import { useCreateFood, useDeleteFood, useFoods, useUpdateFood } from '~/hooks/use-foods'
import { apiErrorMessage } from '~/lib/api'
import { categoryList, getCategoryMeta } from '~/lib/categories'
import { useAccentColor } from '~/lib/use-accent-color'

type Editing = { mode: 'new' } | { mode: 'edit'; food: FoodDto } | null

export default function FoodsScreen() {
  const router = useRouter()
  const accent = useAccentColor()
  const foods = useFoods()
  const del = useDeleteFood()
  const update = useUpdateFood()
  const [editing, setEditing] = useState<Editing>(null)

  const list = foods.data ?? []
  const favorites = list.filter((f) => f.isFavorite)
  const custom = list.filter((f) => !f.isPreset)

  function toggleFav(food: FoodDto) {
    update.mutate({ id: food.id, input: { isFavorite: !food.isFavorite } })
  }

  function onDelete(food: FoodDto) {
    Alert.alert('Hapus makanan?', `"${food.name}" bakal dihapus.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () =>
          del.mutate(food.id, {
            onError: (err) => Alert.alert('Gagal', apiErrorMessage(err)),
          }),
      },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <View className="flex-row items-center justify-between px-4 pt-2">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.back()}
              className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-zinc-900"
            >
              <ChevronLeft size={20} color="#71717a" />
            </Pressable>
            <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Makanan Saya
            </Text>
          </View>
          <Pressable
            onPress={() => setEditing({ mode: 'new' })}
            accessibilityLabel="Tambah makanan"
            className="h-9 w-9 items-center justify-center rounded-full bg-primary-600 active:opacity-80"
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-4">
          {favorites.length > 0 ? (
            <View className="mb-5">
              <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Favorit
              </Text>
              <FoodList
                foods={favorites}
                onFav={toggleFav}
                onEdit={(f) => setEditing({ mode: 'edit', food: f })}
                onDelete={onDelete}
              />
            </View>
          ) : null}

          <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Makanan custom
          </Text>
          {custom.length > 0 ? (
            <FoodList
              foods={custom}
              onFav={toggleFav}
              onEdit={(f) => setEditing({ mode: 'edit', food: f })}
              onDelete={onDelete}
            />
          ) : (
            <View className="items-center rounded-card bg-white px-6 py-10 dark:bg-zinc-900">
              <Heart size={24} color={accent} />
              <Text className="mt-3 font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
                Belum ada makanan custom
              </Text>
              <Text className="mt-1 text-center font-sans text-sm text-zinc-500 dark:text-zinc-400">
                Tambah makanan yang sering lo makan biar gampang dicatat.
              </Text>
            </View>
          )}
        </ScrollView>
      </ScreenFade>

      <FoodEditor editing={editing} onClose={() => setEditing(null)} />
    </SafeAreaView>
  )
}

function FoodList({
  foods,
  onFav,
  onEdit,
  onDelete,
}: {
  foods: FoodDto[]
  onFav: (f: FoodDto) => void
  onEdit: (f: FoodDto) => void
  onDelete: (f: FoodDto) => void
}) {
  return (
    <View className="gap-2">
      {foods.map((f) => {
        const meta = getCategoryMeta(f.category)
        const Icon = meta.icon
        return (
          <View
            key={f.id}
            className="flex-row items-center gap-3 rounded-card bg-white px-4 py-3 dark:bg-zinc-900"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: meta.soft }}
            >
              <Icon size={18} color={meta.tint} />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {f.name}
              </Text>
              <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
                {f.servingLabel} · {formatKcal(f.calories)}
              </Text>
            </View>
            <Pressable onPress={() => onFav(f)} className="p-1.5">
              <Heart
                size={18}
                color={f.isFavorite ? '#ef4444' : '#a1a1aa'}
                fill={f.isFavorite ? '#ef4444' : 'none'}
              />
            </Pressable>
            {!f.isPreset ? (
              <>
                <Pressable onPress={() => onEdit(f)} className="p-1.5">
                  <Pencil size={16} color="#71717a" />
                </Pressable>
                <Pressable onPress={() => onDelete(f)} className="p-1.5">
                  <Trash2 size={16} color="#ef4444" />
                </Pressable>
              </>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

function FoodEditor({ editing, onClose }: { editing: Editing; onClose: () => void }) {
  const create = useCreateFood()
  const update = useUpdateFood()
  const food = editing?.mode === 'edit' ? editing.food : null

  const [name, setName] = useState('')
  const [serving, setServing] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carb, setCarb] = useState('')
  const [fat, setFat] = useState('')
  const [category, setCategory] = useState<FoodCategory>('other')

  const [lastId, setLastId] = useState<string | null>(null)
  const editingId =
    editing?.mode === 'edit' ? editing.food.id : editing?.mode === 'new' ? 'new' : null
  if (editingId && editingId !== lastId) {
    setLastId(editingId)
    setName(food?.name ?? '')
    setServing(food?.servingLabel ?? '1 porsi')
    setCalories(food ? String(food.calories) : '')
    setProtein(food ? String(Math.round(food.protein)) : '')
    setCarb(food ? String(Math.round(food.carb)) : '')
    setFat(food ? String(Math.round(food.fat)) : '')
    setCategory(food?.category ?? 'other')
  }

  function handleClose() {
    setLastId(null)
    onClose()
  }

  function save() {
    if (!name.trim()) {
      Alert.alert('Nama kosong', 'Isi dulu nama makanannya.')
      return
    }
    const input: CreateFoodInput = {
      name: name.trim(),
      category,
      servingLabel: serving.trim() || '1 porsi',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carb: Number(carb) || 0,
      fat: Number(fat) || 0,
    }
    if (food) {
      update.mutate(
        { id: food.id, input },
        { onSuccess: handleClose, onError: (err) => Alert.alert('Gagal', apiErrorMessage(err)) },
      )
    } else {
      create.mutate(input, {
        onSuccess: handleClose,
        onError: (err) => Alert.alert('Gagal', apiErrorMessage(err)),
      })
    }
  }

  return (
    <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-sheet bg-cream p-5 dark:bg-zinc-950">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {food ? 'Edit makanan' : 'Makanan baru'}
            </Text>
            <Pressable
              onPress={handleClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
            >
              <X size={18} color="#71717a" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }}>
            <Input label="Nama" value={name} onChange={setName} />
            <Input label="Label porsi" value={serving} onChange={setServing} />
            <Input
              label="Kalori (kkal)"
              value={calories}
              onChange={setCalories}
              keyboard="number-pad"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Protein"
                  value={protein}
                  onChange={setProtein}
                  keyboard="number-pad"
                />
              </View>
              <View className="flex-1">
                <Input label="Karbo" value={carb} onChange={setCarb} keyboard="number-pad" />
              </View>
              <View className="flex-1">
                <Input label="Lemak" value={fat} onChange={setFat} keyboard="number-pad" />
              </View>
            </View>
            <Text className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Kategori
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {categoryList.map((c) => {
                const active = category === c.key
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setCategory(c.key)}
                    className={
                      active
                        ? 'rounded-full bg-primary-600 px-3.5 py-2'
                        : 'rounded-full bg-white px-3.5 py-2 dark:bg-zinc-900'
                    }
                  >
                    <Text
                      className={
                        active
                          ? 'font-sans text-xs font-semibold text-white'
                          : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                      }
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
          <Pressable
            onPress={save}
            disabled={create.isPending || update.isPending}
            className="mt-4 items-center rounded-full bg-primary-600 py-3.5 active:opacity-90 disabled:opacity-50"
          >
            <Text className="font-sans text-sm font-semibold text-white">Simpan</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function Input({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  keyboard?: 'number-pad'
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#a1a1aa"
        keyboardType={keyboard}
        className="rounded-input bg-white px-4 py-3 font-sans text-base text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
      />
    </View>
  )
}
