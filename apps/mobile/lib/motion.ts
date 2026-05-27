import { useEffect, useState } from 'react'
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

export const SPRING_PRESS = { damping: 15, stiffness: 400 }
export const SPRING_ENTRY = { damping: 18, stiffness: 140 }
export const SPRING_POP = { damping: 5, stiffness: 450 }

export const staggerDelay = (i: number) => i * 80

export function usePressScale(pressed = 0.96) {
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return {
    style,
    onPressIn: () => {
      scale.value = withSpring(pressed, SPRING_PRESS)
    },
    onPressOut: () => {
      scale.value = withSpring(1, SPRING_PRESS)
    },
  }
}

export function useRandomCalCycle(active: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setValue(Math.floor(Math.random() * 900) + 100), 60)
    return () => clearInterval(id)
  }, [active])
  return value
}

export function useStepRotation(active: boolean, steps: string[], intervalMs = 1200) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!active) {
      setIndex(0)
      return
    }
    const id = setInterval(() => setIndex((p) => (p + 1) % steps.length), intervalMs)
    return () => clearInterval(id)
  }, [active, steps.length, intervalMs])
  return steps[index] ?? steps[0] ?? ''
}
