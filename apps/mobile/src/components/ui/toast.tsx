import { useEffect, useCallback } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { Colors, Radius, Spacing } from '@/constants/tokens'

export type ToastType = 'error' | 'info' | 'success'

interface ToastProps {
  visible: boolean
  title: string
  message?: string
  type?: ToastType
  duration?: number
  onHide: () => void
}

const ICONS: Record<ToastType, string> = {
  error: '✕',
  info: 'i',
  success: '✓',
}

const ACCENT: Record<ToastType, string> = {
  error: '#EF4444',
  info: Colors.primary,
  success: '#22C55E',
}

export function Toast({
  visible,
  title,
  message,
  type = 'error',
  duration = 3500,
  onHide,
}: ToastProps) {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(120)
  const opacity = useSharedValue(0)

  const hide = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 })
    translateY.value = withTiming(120, { duration: 250 }, (done) => {
      if (done) runOnJS(onHide)()
    })
  }, [onHide, opacity, translateY])

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 })
      opacity.value = withTiming(1, { duration: 200 })
      const timer = setTimeout(hide, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, hide, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  if (!visible) return null

  const accent = ACCENT[type]

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + 16 },
        animatedStyle,
      ]}
    >
      <TouchableOpacity style={styles.inner} onPress={hide} activeOpacity={0.9}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '20' }]}>
          <Text variant="headline" color={accent}>{ICONS[type]}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text variant="headline" color={Colors.textPrimary}>{title}</Text>
          {message ? (
            <Text variant="footnote" color={Colors.textSecondary} style={styles.msg}>
              {message}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
  },
  inner: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  msg: {
    marginTop: 2,
  },
})
