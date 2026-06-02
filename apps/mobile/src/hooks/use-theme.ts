import { Colors } from '@/constants/tokens'
import type { ColorTokens } from '@/constants/tokens'

export function useTheme(): { colors: ColorTokens } {
  return { colors: Colors }
}
