export type AnalyticsEvent =
  | 'log_food_photo'
  | 'log_food_audio'
  | 'log_food_text'
  | 'log_food_manual'
  | 'recipe_generate'
  | 'nearby_recommend'
  | 'cimit_chat'
  | 'cimit_tts'
  | 'paywall_open'
  | 'quota_blocked'

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log('[analytics]', event, props ?? {})
  }
}
