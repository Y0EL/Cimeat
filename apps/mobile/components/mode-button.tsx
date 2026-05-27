import type { ComponentType } from 'react'
import { useEffect } from 'react'
import { Pressable, Text } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import { SPRING_POP } from '~/lib/motion'
import { useThemeColors } from '~/lib/theme'

type IconProps = { size?: number; color?: string }

export type ModeItem<K extends string = string> = {
  key: K
  label: string
  Icon: ComponentType<IconProps>
  color: string
}

export function ModeButton<K extends string>({
  item,
  active,
  onPress,
}: {
  item: ModeItem<K>
  active: boolean
  onPress: () => void
}) {
  const c = useThemeColors()
  const iconScale = useSharedValue(1)
  const cardScale = useSharedValue(1)

  useEffect(() => {
    if (active) {
      iconScale.value = withSequence(withSpring(1.5, SPRING_POP), withSpring(1, { damping: 12 }))
      cardScale.value = withSequence(withSpring(0.94, { damping: 10 }), withSpring(1, { damping: 12 }))
    }
  }, [active, iconScale, cardScale])

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }))
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }))

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.9 : 1 })}>
      <Animated.View style={[{ alignItems: 'center', borderRadius: 20, backgroundColor: active ? item.color : c.card, paddingVertical: 14 }, cardStyle]}>
        <Animated.View style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: active ? 'rgba(255,255,255,0.2)' : c.cardAlt, alignItems: 'center', justifyContent: 'center' }, iconStyle]}>
          <item.Icon size={18} color={active ? '#ffffff' : c.textSub} />
        </Animated.View>
        <Text style={{ marginTop: 6, fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : c.textSub }}>
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}
