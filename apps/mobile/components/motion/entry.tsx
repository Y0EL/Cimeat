import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { staggerDelay } from '~/lib/motion'

export function EntryView({
  index = 0,
  delay,
  duration = 400,
  children,
  style,
}: {
  index?: number
  delay?: number
  duration?: number
  children: ReactNode
  style?: ViewStyle
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay ?? staggerDelay(index)).duration(duration)}
      style={style}
    >
      {children}
    </Animated.View>
  )
}
