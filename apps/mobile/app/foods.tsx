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
import { useThemeColors } from '~/lib/theme'

type Editing = { mode: 'new' } | { mode: 'edit'; food: FoodDto } | null

export default function FoodsScreen() {
  const c = useThemeColors()
  const router = useRouter()
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScreenFade>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: c.card }}
            >
              <ChevronLeft size={20} color={c.textSub} />
            </Pressable>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 20, color: c.text }}>
              Makanan Saya
            </Text>
          </View>
          <Pressable
            onPress={() => setEditing({ mode: 'new' })}
            accessibilityLabel="Tambah makanan"
            style={({ pressed }) => ({ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FF6B35', opacity: pressed ? 0.8 : 1 })}
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 }}>
          {favorites.length > 0 ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 8, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.textSub }}>
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

          <Text style={{ marginBottom: 8, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.textSub }}>
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
            <View style={{ alignItems: 'center', borderRadius: 24, backgroundColor: c.card, paddingHorizontal: 24, paddingVertical: 40 }}>
              <Heart size={24} color="#FF6B35" />
              <Text style={{ marginTop: 12, fontFamily: 'Outfit_700Bold', fontSize: 16, color: c.text }}>
                Belum ada makanan custom
              </Text>
              <Text style={{ marginTop: 4, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.textSub }}>
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
  const c = useThemeColors()
  return (
    <View style={{ gap: 8 }}>
      {foods.map((f) => {
        const meta = getCategoryMeta(f.category)
        const Icon = meta.icon
        return (
          <View
            key={f.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: meta.soft }}>
              <Icon size={18} color={meta.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.text }}>
                {f.name}
              </Text>
              <Text style={{ marginTop: 2, fontFamily: 'Outfit_400Regular', fontSize: 12, color: c.textSub }}>
                {f.servingLabel} · {formatKcal(f.calories)}
              </Text>
            </View>
            <Pressable onPress={() => onFav(f)} style={{ padding: 6 }}>
              <Heart
                size={18}
                color={f.isFavorite ? '#ef4444' : c.textSub}
                fill={f.isFavorite ? '#ef4444' : 'none'}
              />
            </Pressable>
            {!f.isPreset ? (
              <>
                <Pressable onPress={() => onEdit(f)} style={{ padding: 6 }}>
                  <Pencil size={16} color={c.textSub} />
                </Pressable>
                <Pressable onPress={() => onDelete(f)} style={{ padding: 6 }}>
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
  const c = useThemeColors()
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
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: c.bg, padding: 20 }}>
          <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, color: c.text }}>
              {food ? 'Edit makanan' : 'Makanan baru'}
            </Text>
            <Pressable
              onPress={handleClose}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: c.cardAlt }}
            >
              <X size={18} color={c.textSub} />
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
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Protein"
                  value={protein}
                  onChange={setProtein}
                  keyboard="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Karbo" value={carb} onChange={setCarb} keyboard="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Lemak" value={fat} onChange={setFat} keyboard="number-pad" />
              </View>
            </View>
            <Text style={{ marginBottom: 6, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
              Kategori
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categoryList.map((cat) => {
                const active = category === cat.key
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    style={{ borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: active ? '#FF6B35' : c.card }}
                  >
                    <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : c.textSub }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
          <Pressable
            onPress={save}
            disabled={create.isPending || update.isPending}
            style={({ pressed }) => ({ marginTop: 16, alignItems: 'center', borderRadius: 99, backgroundColor: '#FF6B35', paddingVertical: 14, opacity: pressed || create.isPending || update.isPending ? 0.7 : 1 })}
          >
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#ffffff' }}>Simpan</Text>
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
  const c = useThemeColors()
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ marginBottom: 6, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.textSub }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={c.textSub}
        keyboardType={keyboard}
        style={{ borderRadius: 14, backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 16, color: c.text }}
      />
    </View>
  )
}
