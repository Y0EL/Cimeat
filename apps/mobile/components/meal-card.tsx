import { Text, View } from 'react-native'
import { formatKcal } from '@cimeat/chat-core'
import { getCategoryMeta, type CategoryKey } from '~/lib/categories'
import { useThemeColors } from '~/lib/theme'

type Props = {
  category?: CategoryKey
  title: string
  subtitle?: string
  calories: number
  icon?: string | null
}

export function MealCard({ category = 'other', title, subtitle, calories, icon }: Props) {
  const c = useThemeColors()
  const meta = getCategoryMeta(category)
  const Icon = meta.icon

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: meta.soft }}>
        {icon ? <Text style={{ fontSize: 20 }}>{icon}</Text> : <Icon size={20} color={meta.tint} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ marginTop: 2, fontFamily: 'Outfit_400Regular', fontSize: 12, color: c.textSub }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, color: c.orange, fontVariant: ['tabular-nums'] }}>
        {formatKcal(calories)}
      </Text>
    </View>
  )
}
