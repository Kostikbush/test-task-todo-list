export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function shiftDate(days: number, from = new Date()): string {
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

export function formatDate(value: string, short = false): string {
  if (value === dateKey()) return 'Сегодня'
  if (value === shiftDate(1)) return 'Завтра'
  return new Intl.DateTimeFormat('ru', { day: 'numeric', month: short ? 'short' : 'long' }).format(
    new Date(`${value}T12:00:00`),
  )
}

export function clockTime(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export function duration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return minutes >= 60 ? `${Math.floor(minutes / 60)} ч ${minutes % 60} мин` : `${minutes} мин`
}

export function plural(value: number, forms: [string, string, string]): string {
  const n = Math.abs(value) % 100
  return forms[n > 10 && n < 20 ? 2 : n % 10 === 1 ? 0 : n % 10 > 1 && n % 10 < 5 ? 1 : 2]
}

export const uid = () => crypto.randomUUID()
