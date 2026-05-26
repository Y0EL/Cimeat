import { Text, View } from 'react-native'
import { MACRO_COLORS } from '~/lib/categories'

type MacroKey = 'protein' | 'carb' | 'fat'

const LABELS: Record<MacroKey, string> = {
  protein: 'Protein',
  carb: 'Karbo',
  fat: 'Lemak',
}

export function MacroBar({ macro, value, goal }: { macro: MacroKey; value: number; goal: number }) {
  const color = MACRO_COLORS[macro]
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0

  return (
    <View className="flex-1">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-sans text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {LABELS[macro]}
        </Text>
        <Text
          className="font-sans text-[11px] text-zinc-400"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {Math.round(value)}/{Math.round(goal)}g
        </Text>
      </View>
      <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
      </View>
    </View>
  )
}

export function MacroBarRow({
  protein,
  carb,
  fat,
  goalProtein,
  goalCarb,
  goalFat,
}: {
  protein: number
  carb: number
  fat: number
  goalProtein: number
  goalCarb: number
  goalFat: number
}) {
  return (
    <View className="flex-row gap-4">
      <MacroBar macro="protein" value={protein} goal={goalProtein} />
      <MacroBar macro="carb" value={carb} goal={goalCarb} />
      <MacroBar macro="fat" value={fat} goal={goalFat} />
    </View>
  )
}
