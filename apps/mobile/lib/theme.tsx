import AsyncStorage from '@react-native-async-storage/async-storage'
import { colorScheme, useColorScheme } from 'nativewind'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Appearance } from 'react-native'

export type ThemePref = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'cimeat.theme'

function isPref(value: string | null): value is ThemePref {
  return value === 'light' || value === 'dark' || value === 'system'
}

type ThemeContextValue = {
  pref: ThemePref
  setPref: (next: ThemePref) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('light')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (isPref(value)) setPrefState(value)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (pref === 'light' || pref === 'dark') {
      colorScheme.set(pref)
      return
    }
    const apply = () => {
      const os = Appearance.getColorScheme()
      colorScheme.set(os === 'dark' ? 'dark' : 'light')
    }
    apply()
    const sub = Appearance.addChangeListener(apply)
    return () => sub.remove()
  }, [pref])

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  }, [])

  return <ThemeContext.Provider value={{ pref, setPref }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme harus dipanggil di dalam ThemeProvider')
  return ctx
}

export type ThemeColors = {
  bg: string
  card: string
  cardAlt: string
  text: string
  textSub: string
  textFaint: string
  border: string
  orange: string
  orangeSoft: string
  blue: string
  shadow: string
  dark: boolean
}

export function useThemeColors(): ThemeColors {
  const { colorScheme: scheme } = useColorScheme()
  const isDark = scheme === 'dark'
  return {
    bg: isDark ? '#0E0F11' : '#F8F7F4',
    card: isDark ? '#1A1C1F' : '#FFFFFF',
    cardAlt: isDark ? '#222527' : '#F8F7F4',
    text: isDark ? '#F0EDE6' : '#1A1C1E',
    textSub: isDark ? '#7C7A75' : '#8A8886',
    textFaint: isDark ? '#444240' : '#D0CEC9',
    border: isDark ? '#252729' : '#F0EEE9',
    orange: '#FF6B35',
    orangeSoft: isDark ? '#2D1A0F' : '#FFF3EE',
    blue: '#0ea5e9',
    shadow: isDark ? '#000000' : '#1A1C1E',
    dark: isDark,
  }
}
