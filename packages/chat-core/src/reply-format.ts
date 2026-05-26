export function formatKcal(calories: number): string {
  const rounded = Math.round(calories)
  return `${rounded.toLocaleString('id-ID')} kkal`
}

export function formatMacro(grams: number): string {
  const value = Math.round(grams * 10) / 10
  return `${value.toLocaleString('id-ID')}g`
}

export function buildMealReply(input: {
  name: string
  calories: number
  remainingCalories?: number
}): string {
  const base = `Tercatat. ${capitalize(input.name)} ${formatKcal(input.calories)}`
  if (typeof input.remainingCalories === 'number') {
    const left = Math.round(input.remainingCalories)
    if (left >= 0) return `${base}. Sisa ${formatKcal(left)} buat hari ini.`
    return `${base}. Lo lebih ${formatKcal(Math.abs(left))} dari target hari ini.`
  }
  return base
}

function capitalize(text: string): string {
  if (text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}
