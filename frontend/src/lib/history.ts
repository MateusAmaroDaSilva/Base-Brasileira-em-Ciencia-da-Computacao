import type { HistoryEntry } from '../types'

const KIND_LABEL: Record<HistoryEntry['kind'], string> = {
  publicacoes: 'Publicações',
  autores: 'Autores',
  revistas: 'Revistas',
}

/** "Publicações · Área · 42 resultados", sem as partes que o servidor nao sabe. */
export function historyMeta(entry: HistoryEntry): string {
  const count = entry.result_count
  return [
    KIND_LABEL[entry.kind] ?? 'Publicações',
    entry.area,
    count === null || count === undefined ? null : `${count.toLocaleString('pt-BR')} ${count === 1 ? 'resultado' : 'resultados'}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export const repeatLink = (query: string) => `/artigos?q=${encodeURIComponent(query)}`
