import { Volume2, VolumeX } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Pressable } from 'react-native'
import type { CimitTone } from '@cimeat/types'
import { useCimitTts } from '~/hooks/use-cimit'
import { playRemoteAudio, stopRemoteAudio } from '~/lib/audio'
import { getCimitVoice } from '~/lib/cimit-voice'
import { track } from '~/lib/analytics'

type Props = {
  text: string
  tone?: CimitTone
  size?: number
  color?: string
}

export function TtsButton({ text, tone, size = 18, color = '#ea580c' }: Props) {
  const tts = useCimitTts()
  const [playing, setPlaying] = useState(false)

  async function onPress() {
    if (playing) {
      stopRemoteAudio()
      setPlaying(false)
      return
    }
    track('cimit_tts')
    try {
      const voice = await getCimitVoice()
      const res = await tts.mutateAsync(tone ? { text, tone, voice } : { text, voice })
      await playRemoteAudio(res.audioUrl)
      setPlaying(true)
      setTimeout(() => setPlaying(false), 30_000)
    } catch {
      setPlaying(false)
    }
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Stop suara Cimit' : 'Dengerin Cimit'}
      className="h-8 w-8 items-center justify-center rounded-full bg-primary-100 active:opacity-70 dark:bg-primary-950"
    >
      {tts.isPending ? (
        <ActivityIndicator size="small" color={color} />
      ) : playing ? (
        <VolumeX size={size} color={color} />
      ) : (
        <Volume2 size={size} color={color} />
      )}
    </Pressable>
  )
}
