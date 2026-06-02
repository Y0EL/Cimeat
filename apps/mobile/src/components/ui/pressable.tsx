import { Pressable as RNPressable, type PressableProps } from 'react-native'
import * as Haptics from 'expo-haptics'

interface Props extends PressableProps {
  haptic?: boolean
}

export function Pressable({ haptic = true, onPress, style, ...props }: Props) {
  function handlePress(e: Parameters<NonNullable<PressableProps['onPress']>>[0]) {
    if (haptic) {
      Haptics.selectionAsync()
    }
    onPress?.(e)
  }

  return (
    <RNPressable
      onPress={handlePress}
      style={(state) => [
        { opacity: state.pressed ? 0.7 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    />
  )
}
