/** O servidor manda horarios em UTC sem o "Z"; sem ele o navegador os leria como hora local. */
export function parseUtc(value: string): Date {
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`)
}

export function timeAgo(value: string, now = new Date()): string {
  const date = parseUtc(value)
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24 && date.toDateString() === now.toDateString()) return `há ${hours} h`
  return date.toLocaleDateString('pt-BR')
}

export type HistoryGroup = 'Hoje' | 'Ontem' | 'Semana passada' | 'Mais antigas'

export function historyGroup(value: string, now = new Date()): HistoryGroup {
  const date = parseUtc(value)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days <= 7) return 'Semana passada'
  return 'Mais antigas'
}
