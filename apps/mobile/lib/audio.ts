import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio'
import { File } from 'expo-file-system'

export async function uriToBase64(uri: string): Promise<string> {
  const file = new File(uri)
  return file.base64()
}

export function mimeForUri(uri: string): string {
  const lower = uri.toLowerCase()
  if (lower.endsWith('.m4a')) return 'audio/m4a'
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.3gp')) return 'audio/3gpp'
  if (lower.endsWith('.webm')) return 'audio/webm'
  return 'audio/m4a'
}

export async function enableRecordingMode() {
  try {
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
  } catch {}
}

export async function enablePlaybackMode() {
  try {
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
  } catch {}
}

let ttsPlayer: AudioPlayer | null = null

export async function playRemoteAudio(url: string): Promise<void> {
  await enablePlaybackMode()
  stopRemoteAudio()
  try {
    ttsPlayer = createAudioPlayer({ uri: url })
    ttsPlayer.play()
  } catch (err) {
    console.warn('playRemoteAudio failed', err)
  }
}

export function stopRemoteAudio(): void {
  if (ttsPlayer) {
    try {
      ttsPlayer.pause()
      ttsPlayer.remove()
    } catch {}
    ttsPlayer = null
  }
}
