import { StyleSheet, View } from 'react-native'
import Svg, { Polyline, Line, Circle } from 'react-native-svg'
import { Text } from './ui'
import { useTheme } from '@/hooks/use-theme'
import { Spacing } from '@/constants/tokens'

interface DataPoint {
  label: string
  value: number
}

interface TrendChartProps {
  data: DataPoint[]
  goalLine?: number
  height?: number
}

export function TrendChart({ data, goalLine, height = 180 }: TrendChartProps) {
  const { colors } = useTheme()

  if (data.length === 0) return null

  const padding = { top: 16, bottom: 28, left: 8, right: 8 }
  const chartWidth = 340
  const chartHeight = height - padding.top - padding.bottom
  const maxVal = Math.max(...data.map((d) => d.value), goalLine ?? 0) * 1.1
  const minVal = 0

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * (chartWidth - padding.left - padding.right)
    const y = padding.top + (1 - (d.value - minVal) / (maxVal - minVal)) * chartHeight
    return { x, y, label: d.label }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const goalY = goalLine
    ? padding.top + (1 - (goalLine - minVal) / (maxVal - minVal)) * chartHeight
    : null

  return (
    <View>
      <Svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        {goalY !== null && (
          <Line
            x1={padding.left}
            y1={goalY}
            x2={chartWidth - padding.right}
            y2={goalY}
            stroke={colors.textTertiary}
            strokeWidth={1}
            strokeDasharray="6,4"
          />
        )}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.textPrimary}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.textPrimary} />
        ))}
      </Svg>
      <View style={styles.labels}>
        {points
          .filter((_, i) => data.length <= 7 || i % Math.ceil(data.length / 7) === 0)
          .map((p, i) => (
            <Text key={i} variant="caption" color={colors.textTertiary} style={{ position: 'absolute', left: p.x - 14 }}>
              {p.label}
            </Text>
          ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labels: {
    height: 16,
    position: 'relative',
  },
})
