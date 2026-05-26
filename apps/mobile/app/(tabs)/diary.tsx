import { useRouter } from 'expo-router'
import { Search, Trash2 } from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { MealDto, MealType } from '@cimeat/types'
import { formatKcal } from '@cimeat/chat-core'
import { MealCard } from '~/components/meal-card'
import { ScreenFade } from '~/components/screen-fade'
import { useDeleteMeal, useMeals, type MealFilters } from '~/hooks/use-meals'
import { apiErrorMessage } from '~/lib/api'

const MEAL_FILTERS: { key: MealType | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'breakfast', label: 'Sarapan' },
  { key: 'lunch', label: 'Siang' },
  { key: 'dinner', label: 'Malam' },
  { key: 'snack', label: 'Camilan' },
]

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

function formatDayLabel(key: string): string {
  const d = new Date(`${key}T00:00:00`)
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (key === today) return 'Hari ini'
  if (key === yesterday) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function DiaryTab() {
  const router = useRouter()
  const del = useDeleteMeal()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<MealType | 'all'>('all')

  const filters: MealFilters = {}
  if (search.trim()) filters.q = search.trim()
  if (filter !== 'all') filters.mealType = filter
  const meals = useMeals(filters)

  const rows = useMemo(
    () => meals.data?.pages.flatMap((p) => p.items) ?? [],
    [meals.data],
  )

  const days = useMemo(() => {
    const map = new Map<string, MealDto[]>()
    for (const m of rows) {
      const key = dayKey(m.loggedAt)
      const list = map.get(key) ?? []
      list.push(m)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [rows])

  function onDelete(m: MealDto) {
    del.mutate(m.id, {
      onError: (err) => Alert.alert('Gagal hapus', apiErrorMessage(err)),
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-4 pt-3">
            <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">Catatan</Text>
            <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Diary makan
            </Text>
          </View>

          <View className="mx-4 mt-4 flex-row items-center gap-3 rounded-input bg-white px-4 py-3 dark:bg-zinc-900">
            <Search size={18} color="#a1a1aa" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cari makanan"
              placeholderTextColor="#a1a1aa"
              className="flex-1 font-sans text-sm text-zinc-900 dark:text-zinc-100"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerClassName="px-4 gap-2"
          >
            {MEAL_FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  className={
                    active
                      ? 'rounded-full bg-primary-600 px-4 py-2'
                      : 'rounded-full bg-white px-4 py-2 active:opacity-70 dark:bg-zinc-900'
                  }
                >
                  <Text
                    className={
                      active
                        ? 'font-sans text-xs font-semibold text-white'
                        : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                    }
                  >
                    {f.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View className="mx-4 mt-5">
            {days.length === 0 ? (
              <View className="items-center rounded-card bg-white px-6 py-12 dark:bg-zinc-900">
                <Text className="font-sans text-sm text-zinc-400">
                  {search.trim() || filter !== 'all'
                    ? 'Gak ada yang cocok.'
                    : 'Belum ada catatan makan.'}
                </Text>
              </View>
            ) : (
              days.map(([key, dayMeals]) => {
                const total = dayMeals.reduce((s, m) => s + m.calories, 0)
                return (
                  <View key={key} className="mb-6">
                    <View className="mb-2 flex-row items-baseline justify-between">
                      <Text className="font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {formatDayLabel(key)}
                      </Text>
                      <Text className="font-display text-sm font-bold text-primary-600 dark:text-primary-300">
                        {formatKcal(total)}
                      </Text>
                    </View>
                    <View className="overflow-hidden rounded-card bg-white dark:bg-zinc-900">
                      {dayMeals.map((m) => (
                        <SwipeableRow key={m.id} onDelete={() => onDelete(m)}>
                          <View className="bg-white px-4 dark:bg-zinc-900">
                            <MealCard
                              title={m.name}
                              subtitle={`${mealTypeLabel(m.mealType)}${
                                m.servings !== 1 ? ` · ${m.servings} porsi` : ''
                              }`}
                              calories={m.calories}
                            />
                          </View>
                        </SwipeableRow>
                      ))}
                    </View>
                  </View>
                )
              })
            )}

            {meals.hasNextPage ? (
              <Pressable
                onPress={() => meals.fetchNextPage()}
                disabled={meals.isFetchingNextPage}
                className="mb-4 items-center rounded-full bg-white py-3 active:opacity-70 dark:bg-zinc-900"
              >
                <Text className="font-sans text-sm font-semibold text-primary-600 dark:text-primary-200">
                  {meals.isFetchingNextPage ? 'Memuat' : 'Muat lagi'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </ScreenFade>

      <Pressable
        onPress={() => router.push('/add-modal')}
        accessibilityLabel="Tambah makanan"
        className="absolute bottom-28 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary-600 active:opacity-80"
        style={{
          shadowColor: '#ea580c',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Text className="font-display text-3xl font-light text-white">+</Text>
      </Pressable>
    </SafeAreaView>
  )
}

function mealTypeLabel(type: MealType): string {
  return type === 'breakfast'
    ? 'Sarapan'
    : type === 'lunch'
      ? 'Makan siang'
      : type === 'dinner'
        ? 'Makan malam'
        : 'Camilan'
}

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode
  onDelete: () => void
}) {
  const ref = useRef<SwipeableMethods>(null)
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hapus"
          onPress={() => {
            ref.current?.close()
            onDelete()
          }}
          className="w-24 flex-col items-center justify-center bg-danger active:opacity-80"
        >
          <Trash2 size={20} color="#ffffff" />
          <Text className="mt-1 font-sans text-xs font-semibold text-white">Hapus</Text>
        </Pressable>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  )
}
