import * as Location from 'expo-location'

export type Coords = { lat: number; lng: number }

export type LocationResult =
  | { ok: true; coords: Coords }
  | { ok: false; reason: 'denied' | 'error' }

export async function getCurrentCoords(): Promise<LocationResult> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync()
    if (!granted) return { ok: false, reason: 'denied' }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    return { ok: true, coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
