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
            <Stop offset="0" stopColor="#FF6B35" />
            <Stop offset="1" stopColor="#FF8C61" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FF6B35"
          strokeOpacity={0.12}
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
          style={{ fontFamily: 'Outfit_900Black', fontSize: 48, color: '#1A1C1E', fontVariant: ['tabular-nums'] }}
        >
          {Math.abs(remaining).toLocaleString('id-ID')}
        </Text>
        <Text style={{ marginTop: 4, fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8A8886' }}>
          {over ? 'kkal lebih' : 'kkal tersisa'}
        </Text>
        <Text style={{ marginTop: 8, fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A8886' }}>
          {Math.round(consumed).toLocaleString('id-ID')} / {Math.round(goal).toLocaleString('id-ID')}
        </Text>
      </View>
    </View>
  )
}
