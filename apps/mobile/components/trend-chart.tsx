import { useId } from 'react'
import { Text, View } from 'react-native'
import Svg, { Defs, G, Line, LinearGradient, Rect, Stop } from 'react-native-svg'
import type { FlexTrendItem } from '@cimeat/types'

const TOTAL_HEIGHT = 180
const LABEL_HEIGHT = 22
const TOP_PAD = 8
const BAR_WIDTH = 12
const CORNER_RADIUS = 5

function shortLabel(label: string): string {
  if (label.length >= 10) return String(Number.parseInt(label.slice(8, 10), 10))
  if (label.length >= 7) return label.slice(5, 7)
  return label
}

export function TrendChart({
  data,
  width,
  goal,
}: {
  data: FlexTrendItem[]
  width: number
  goal?: number
}) {
  const gradId = useId().replace(/:/g, '')

  if (data.length === 0 || width <= 0) {
    return <View style={{ height: TOTAL_HEIGHT, width }} />
  }

  const chartArea = TOTAL_HEIGHT - LABEL_HEIGHT
  const plotH = chartArea - TOP_PAD
  const max = Math.max(1, ...data.map((d) => d.calories), goal ?? 0)
  const slotWidth = width / data.length
  const goalY = goal ? TOP_PAD + (1 - goal / max) * plotH : null

  return (
    <View style={{ width, height: TOTAL_HEIGHT }}>
      <Svg width={width} height={chartArea}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fb923c" stopOpacity="1" />
            <Stop offset="1" stopColor="#ea580c" stopOpacity="0.7" />
          </LinearGradient>
        </Defs>

        {goalY !== null ? (
          <Line
            x1={0}
            x2={width}
            y1={goalY}
            y2={goalY}
            stroke="#a1a1aa"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ) : null}

        {data.map((d, i) => {
          const isLast = i === data.length - 1
          const slotX = i * slotWidth
          const barX = slotX + (slotWidth - BAR_WIDTH) / 2
          const h = (d.calories / max) * plotH
          if (h <= 0) return null
          return (
            <G key={d.label} opacity={isLast ? 1 : 0.85}>
              <Rect
                x={barX}
                y={chartArea - h}
                width={BAR_WIDTH}
                height={h}
                rx={CORNER_RADIUS}
                fill={`url(#${gradId})`}
              />
            </G>
          )
        })}
      </Svg>
      <View style={{ flexDirection: 'row', height: LABEL_HEIGHT, alignItems: 'center' }}>
        {data.map((d, i) => {
          const isLast = i === data.length - 1
          return (
            <View key={d.label} style={{ width: slotWidth, alignItems: 'center' }}>
              <Text
                className={
                  isLast
                    ? 'font-sans text-xs font-bold text-zinc-900 dark:text-zinc-100'
                    : 'font-sans text-xs text-zinc-400 dark:text-zinc-500'
                }
              >
                {shortLabel(d.label)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
