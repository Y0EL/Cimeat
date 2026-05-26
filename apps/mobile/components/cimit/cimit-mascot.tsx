import { View } from 'react-native'
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg'
import type { CimitTone } from '@cimeat/types'

type Props = {
  size?: number
  tone?: CimitTone
}

export function CimitMascot({ size = 96, tone = 'normal' }: Props) {
  const eyeY = size * 0.46
  const eyeOffset = size * 0.16
  const eyeR = size * 0.055
  const mouthPath =
    tone === 'savage'
      ? `M ${size * 0.36} ${size * 0.62} Q ${size * 0.5} ${size * 0.6} ${size * 0.64} ${size * 0.66}`
      : tone === 'soft'
        ? `M ${size * 0.37} ${size * 0.62} Q ${size * 0.5} ${size * 0.7} ${size * 0.63} ${size * 0.62}`
        : `M ${size * 0.35} ${size * 0.62} Q ${size * 0.5} ${size * 0.74} ${size * 0.65} ${size * 0.62}`

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="cimitBody" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fb923c" />
            <Stop offset="1" stopColor="#ea580c" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size * 0.42} fill="url(#cimitBody)" />
        <Ellipse
          cx={size * 0.42}
          cy={size * 0.4}
          rx={size * 0.16}
          ry={size * 0.12}
          fill="#ffffff"
          opacity={0.18}
        />
        <Circle cx={size / 2 - eyeOffset} cy={eyeY} r={eyeR} fill="#1c1917" />
        <Circle cx={size / 2 + eyeOffset} cy={eyeY} r={eyeR} fill="#1c1917" />
        <Circle cx={size / 2 - eyeOffset + eyeR * 0.4} cy={eyeY - eyeR * 0.4} r={eyeR * 0.35} fill="#fff" />
        <Circle cx={size / 2 + eyeOffset + eyeR * 0.4} cy={eyeY - eyeR * 0.4} r={eyeR * 0.35} fill="#fff" />
        <Circle cx={size / 2 - eyeOffset - eyeR} cy={eyeY + eyeR * 1.6} r={eyeR * 0.9} fill="#fff" opacity={0.28} />
        <Circle cx={size / 2 + eyeOffset + eyeR} cy={eyeY + eyeR * 1.6} r={eyeR * 0.9} fill="#fff" opacity={0.28} />
        <Path d={mouthPath} stroke="#1c1917" strokeWidth={size * 0.03} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  )
}
