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
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#1A1C1E' }}>
          {LABELS[macro]}
        </Text>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#8A8886', fontVariant: ['tabular-nums'] }}>
          {Math.round(value)}/{Math.round(goal)}g
        </Text>
      </View>
      <View style={{ marginTop: 6, height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: '#F0EEE9' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
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
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <MacroBar macro="protein" value={protein} goal={goalProtein} />
      <MacroBar macro="carb" value={carb} goal={goalCarb} />
      <MacroBar macro="fat" value={fat} goal={goalFat} />
    </View>
  )
}
