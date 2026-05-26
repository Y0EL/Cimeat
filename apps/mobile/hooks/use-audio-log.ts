import { useCallback, useState } from 'react'
import { RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio'
import { enableRecordingMode, mimeForUri, uriToBase64 } from '~/lib/audio'

export type RecordedClip = { base64: string; mimeType: string; durationSec: number }

export function useAudioRecording() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const state = useAudioRecorderState(recorder)
  const [preparing, setPreparing] = useState(false)

  const start = useCallback(async () => {
    setPreparing(true)
    try {
      await enableRecordingMode()
      await recorder.prepareToRecordAsync()
      recorder.record()
    } finally {
      setPreparing(false)
    }
  }, [recorder])

  const stop = useCallback(async (): Promise<RecordedClip | null> => {
    await recorder.stop()
    const uri = recorder.uri
    if (!uri) return null
    const base64 = await uriToBase64(uri)
    return { base64, mimeType: mimeForUri(uri), durationSec: recorder.currentTime }
  }, [recorder])

  return {
    isRecording: state.isRecording,
    durationSec: Math.round(state.durationMillis / 1000),
    preparing,
    start,
    stop,
  }
}
