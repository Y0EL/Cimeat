import { Text, View } from 'react-native'
import { formatKcal } from '@cimeat/chat-core'
import { getCategoryMeta, type CategoryKey } from '~/lib/categories'

type Props = {
  category?: CategoryKey
  title: string
  subtitle?: string
  calories: number
  icon?: string | null
}

export function MealCard({ category = 'other', title, subtitle, calories, icon }: Props) {
  const meta = getCategoryMeta(category)
  const Icon = meta.icon

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: meta.soft }}
      >
        {icon ? <Text className="text-xl">{icon}</Text> : <Icon size={20} color={meta.tint} />}
      </View>
      <View className="flex-1">
        <Text
          className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text
        className="font-display text-base font-bold text-primary-600 dark:text-primary-300"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatKcal(calories)}
      </Text>
    </View>
  )
}
