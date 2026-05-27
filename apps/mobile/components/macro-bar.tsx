import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { MACRO_COLORS } from '~/lib/categories'
import { useThemeColors } from '~/lib/theme'

type MacroKey = 'protein' | 'carb' | 'fat'

const LABELS: Record<MacroKey, string> = {
  protein: 'Protein',
  carb: 'Karbo',
  fat: 'Lemak',
}

export function MacroBar({ macro, value, goal }: { macro: MacroKey; value: number; goal: number }) {
  const c = useThemeColors()
  const color = MACRO_COLORS[macro]
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const fill = useSharedValue(0)

  useEffect(() => {
    fill.value = withTiming(pct, { duration: 1000, easing: Easing.out(Easing.cubic) })
  }, [pct, fill])

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }))

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: c.text }}>
          {LABELS[macro]}
        </Text>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 10, color: c.textSub, fontVariant: ['tabular-nums'] }}>
          {Math.round(value)}/{Math.round(goal)}g
        </Text>
      </View>
      <View style={{ marginTop: 6, height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: c.border }}>
        <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: 3 }, fillStyle]} />
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
