import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, type ViewStyle } from 'react-native'
import { useTheme } from '@/hooks/use-theme'
import { Radius } from '@/constants/tokens'

interface SkeletonProps {
  width: number | string
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width, height, borderRadius = Radius.md, style }: SkeletonProps) {
  const { colors } = useTheme()
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  )
}
