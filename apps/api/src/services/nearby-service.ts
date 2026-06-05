import { composeSystemPrompt, nearbyRecommendTask } from '@cimeat/prompts'
import {
  nearbyResponseSchema,
  type CimitTone,
  type NearbyRecommendInput,
  type NearbyResponse,
} from '@cimeat/types'
import type { z } from 'zod'
import { loadEnv } from '../env'
import { logger } from '../logger'
import { generateJson } from './ai-orchestrator'

type Candidate = {
  name: string
  food_type: string
  distance_m: number
}

const nearbyModelSchema = nearbyResponseSchema.omit({ mode: true })

const MOCK_CANDIDATES: Candidate[] = [
  { name: 'Warteg Bahari', food_type: 'warteg', distance_m: 220 },
  { name: 'Ayam Geprek Bensu', food_type: 'ayam geprek', distance_m: 350 },
  { name: 'Soto Ayam Lamongan', food_type: 'soto', distance_m: 480 },
  { name: 'Salad Bar Sehat', food_type: 'salad', distance_m: 600 },
  { name: 'Nasi Padang Sederhana', food_type: 'nasi padang', distance_m: 700 },
]

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

async function fetchPlaces(input: NearbyRecommendInput): Promise<Candidate[]> {
  const env = loadEnv()
  if (!env.GOOGLE_PLACES_API_KEY) return MOCK_CANDIDATES

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.location,places.primaryType,places.types',
      },
      body: JSON.stringify({
        includedTypes: ['restaurant'],
        maxResultCount: 12,
        locationRestriction: {
          circle: {
            center: { latitude: input.lat, longitude: input.lng },
            radius: Math.min(input.radius_m, 50000),
          },
        },
      }),
    })
    if (!res.ok) return MOCK_CANDIDATES
    const data = (await res.json()) as {
      places?: Array<{
        displayName?: { text?: string }
        primaryType?: string
        types?: string[]
        location?: { latitude: number; longitude: number }
      }>
    }
    const results = data.places ?? []
    if (results.length === 0) return MOCK_CANDIDATES

    return results.map((r) => {
      const loc = r.location
      const distance_m = loc ? haversine(input.lat, input.lng, loc.latitude, loc.longitude) : 0
      return {
        name: r.displayName?.text ?? 'Tempat makan',
        food_type: r.primaryType ?? r.types?.[0] ?? 'restaurant',
        distance_m,
      }
    })
  } catch (err) {
    logger.error({ err }, 'google places fetch failed, pakai mock')
    return MOCK_CANDIDATES
  }
}

export async function recommendNearby(
  input: NearbyRecommendInput,
  tone: CimitTone,
): Promise<NearbyResponse> {
  const candidates = await fetchPlaces(input)

  const prompt = [
    `Mode: ${input.mode}.`,
    `Kandidat tempat makan terdekat (JSON): ${JSON.stringify(candidates)}.`,
    'Urutkan dan pilih maksimal 4 yang paling cocok untuk mode tersebut.',
  ].join('\n')

  const ranked = await generateJson<z.infer<typeof nearbyModelSchema>>({
    systemInstruction: composeSystemPrompt(nearbyRecommendTask, { includePersona: true, tone }),
    parts: [{ type: 'text', text: prompt }],
    schema: nearbyModelSchema,
    label: 'nearby',
  })

  return { mode: input.mode, items: ranked.items, cimit_message: ranked.cimit_message }
}
