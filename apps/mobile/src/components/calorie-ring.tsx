import { StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg'
import { Text } from './ui'
import { useTheme } from '@/hooks/use-theme'

interface CalorieRingProps {
  consumed: number
  goal: number
}

export function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const { colors } = useTheme()
  const size = 220
  const strokeWidth = 18
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(consumed / Math.max(goal, 1), 1)
  const offset = circumference * (1 - progress)
  const isOver = consumed > goal
  const remaining = Math.max(goal - consumed, 0)
  const center = size / 2

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.primaryLight} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surface}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={isOver ? colors.destructive : 'url(#ringGrad)'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${offset}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.center}>
        <Text variant="callout" color={colors.textTertiary}>
          {isOver ? 'Dimakan' : 'Tersisa'}
        </Text>
        <Text style={styles.bigNumber} color={isOver ? colors.destructive : colors.textPrimary}>
          {isOver ? consumed : remaining}
        </Text>
        <Text style={styles.subLabel} color={colors.textTertiary}>
          dari {goal} kkal
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: 220,
    height: 220,
    marginVertical: 20,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  bigNumber: {
    fontSize: 48,
    fontFamily: 'Outfit_800ExtraBold',
    lineHeight: 54,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: -2,
  },
})
