import Constants from 'expo-constants'

const API_KEY = (Constants.expoConfig?.extra?.deepgramApiKey as string) ?? ''

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!API_KEY) throw new Error('DEEPGRAM_API key belum diset di .env')

  const fileResponse = await fetch(audioUri)
  const blob = await fileResponse.blob()

  const response = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&language=id&smart_format=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${API_KEY}`,
        'Content-Type': 'audio/mp4',
      },
      body: blob,
    },
  )

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`Deepgram error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const transcript: string =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
  if (!transcript.trim()) throw new Error('Tidak ada kata yang terdeteksi')
  return transcript.trim()
}
