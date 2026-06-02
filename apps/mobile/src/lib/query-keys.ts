export const queryKeys = {
  profile: ['profile'] as const,
  goals: ['goals'] as const,
  foods: ['foods'] as const,
  usage: ['usage', 'today'] as const,
  subscription: ['subscription'] as const,
  summary: {
    daily: (date: string) => ['summary', 'daily', date] as const,
    trend: (period: string, from: string, to: string) =>
      ['summary', 'trend', period, from, to] as const,
  },
  foodLogs: {
    byDate: (date: string) => ['food-logs', 'date', date] as const,
    detail: (id: string) => ['food-logs', 'detail', id] as const,
  },
}
