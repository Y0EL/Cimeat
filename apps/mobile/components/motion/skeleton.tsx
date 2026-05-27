import { useEffect } from 'react'
import { View, type DimensionValue } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useThemeColors } from '~/lib/theme'

export function ShimmerBar({
  width = '100%',
  height = 16,
  radius = 99,
  tint,
}: {
  width?: DimensionValue
  height?: number
  radius?: number
  tint?: string
}) {
  const c = useThemeColors()
  const opacity = useSharedValue(0.4)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.4, { duration: 600 })),
      -1,
      false,
    )
  }, [opacity])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: tint ?? c.border },
        style,
      ]}
    />
  )
}

export function SkeletonLines({
  widths = ['100%', '83%', '67%'],
  tint,
  gap = 12,
}: {
  widths?: DimensionValue[]
  tint?: string
  gap?: number
}) {
  return (
    <View style={{ width: '100%', gap }}>
      {widths.map((w, i) => (
        <ShimmerBar key={i} width={w} tint={tint} />
      ))}
    </View>
  )
}
