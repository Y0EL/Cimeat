import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CimitVoice } from '@cimeat/types'

const KEY = 'cimeat.cimit.voice'

export async function getCimitVoice(): Promise<CimitVoice> {
  const v = await AsyncStorage.getItem(KEY).catch(() => null)
  return v === 'male' || v === 'female' ? v : 'female'
}

export async function setCimitVoice(voice: CimitVoice): Promise<void> {
  await AsyncStorage.setItem(KEY, voice).catch(() => {})
}
