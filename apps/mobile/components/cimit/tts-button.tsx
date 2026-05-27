import { Volume2, VolumeX } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
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

export function TtsButton({ text, tone, size = 18, color = '#FF6B35' }: Props) {
  const tts = useCimitTts()
  const [playing, setPlaying] = useState(false)
  const pulse = useSharedValue(1)

  useEffect(() => {
    if (tts.isPending) {
      pulse.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        false,
      )
    } else {
      pulse.value = withTiming(1, { duration: 200 })
    }
  }, [tts.isPending, pulse])

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

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
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'rgba(255,107,53,0.15)',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Animated.View style={pulseStyle}>
        {playing ? <VolumeX size={size} color={color} /> : <Volume2 size={size} color={color} />}
      </Animated.View>
    </Pressable>
  )
}
