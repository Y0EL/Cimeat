import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const RECORD_HEIGHTS = [18, 30, 44, 28, 52, 36, 48, 24, 56, 40, 60, 32, 48, 22, 44, 30, 52, 20, 38, 28, 44, 26, 36, 18, 32]

function Bar({
  active,
  delay,
  maxH,
  minH,
  color,
}: {
  active: boolean
  delay: number
  maxH: number
  minH: number
  color: string
}) {
  const h = useSharedValue(minH)

  useEffect(() => {
    if (active) {
      h.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(maxH, { duration: 300 + delay * 0.4 }),
            withTiming(minH, { duration: 300 + delay * 0.4 }),
          ),
          -1,
          false,
        ),
      )
    } else {
      cancelAnimation(h)
      h.value = withTiming(minH, { duration: 200 })
    }
  }, [active, h, delay, maxH, minH])

  const style = useAnimatedStyle(() => ({ height: h.value }))
  return <Animated.View style={[{ width: 3, borderRadius: 2, backgroundColor: color }, style]} />
}

export function Waveform({
  active,
  color = '#818cf8',
  count = 25,
  mode = 'record',
}: {
  active: boolean
  color?: string
  count?: number
  mode?: 'record' | 'analyze'
}) {
  const bars = Array.from({ length: count })
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 64, justifyContent: 'center', paddingHorizontal: 12 }}>
      {bars.map((_, i) => {
        const maxH = mode === 'analyze' ? 40 : RECORD_HEIGHTS[i % RECORD_HEIGHTS.length]!
        const minH = mode === 'analyze' ? 10 : 4
        const delay = mode === 'analyze' ? i * 50 : i * 40
        return <Bar key={i} active={active} delay={delay} maxH={maxH} minH={minH} color={color} />
      })}
    </View>
  )
}
