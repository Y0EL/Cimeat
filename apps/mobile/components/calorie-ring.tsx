import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type Props = {
  consumed: number
  goal: number
  size?: number
  strokeWidth?: number
}

export function CalorieRing({ consumed, goal, size = 220, strokeWidth = 18 }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeGoal = goal > 0 ? goal : 1
  const ratio = Math.min(consumed / safeGoal, 1)
  const over = consumed > safeGoal
  const remaining = Math.round(goal - consumed)

  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 900, easing: Easing.out(Easing.cubic) })
  }, [ratio, progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="calorieRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fb923c" />
            <Stop offset="1" stopColor="#ea580c" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fed7aa"
          strokeOpacity={0.5}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={over ? '#ef4444' : 'url(#calorieRing)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text
          className="font-display text-5xl font-extrabold text-zinc-900 dark:text-zinc-100"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {Math.abs(remaining).toLocaleString('id-ID')}
        </Text>
        <Text className="mt-1 font-sans text-xs font-medium uppercase tracking-widest text-zinc-400">
          {over ? 'kkal lebih' : 'kkal tersisa'}
        </Text>
        <Text className="mt-2 font-sans text-xs text-zinc-500 dark:text-zinc-400">
          {Math.round(consumed).toLocaleString('id-ID')} / {Math.round(goal).toLocaleString('id-ID')}
        </Text>
      </View>
    </View>
  )
}
