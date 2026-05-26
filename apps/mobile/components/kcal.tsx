import { Text, View } from 'react-native'

type Size = 'hero' | 'lg' | 'md' | 'sm'
type Tone = 'default' | 'onDark' | 'invert'

const sizes: Record<Size, { unit: string; num: string }> = {
  hero: { unit: 'text-base', num: 'text-5xl' },
  lg: { unit: 'text-xs', num: 'text-2xl' },
  md: { unit: 'text-[10px]', num: 'text-lg' },
  sm: { unit: 'text-[10px]', num: 'text-sm' },
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

export function Kcal({
  value,
  size = 'md',
  tone = 'default',
  unit = 'kkal',
}: {
  value: number
  size?: Size
  tone?: Tone
  unit?: string
}) {
  const numColor =
    tone === 'invert'
      ? 'text-zinc-900 dark:text-white'
      : tone === 'onDark'
        ? 'text-white'
        : 'text-zinc-900 dark:text-zinc-100'
  const unitColor =
    tone === 'invert'
      ? 'text-zinc-500 dark:text-primary-200'
      : tone === 'onDark'
        ? 'text-primary-100'
        : 'text-zinc-400 dark:text-zinc-500'

  return (
    <View className="flex-row items-baseline">
      <Text
        className={`font-display font-extrabold ${sizes[size].num} ${numColor}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatNumber(value)}
      </Text>
      <Text className={`ml-1 font-sans font-medium ${sizes[size].unit} ${unitColor}`}>{unit}</Text>
    </View>
  )
}
