import { useEffect, useState } from 'react'
import { searchArticles } from '../api/articles'
import { AREAS } from '../data/areas'
import { NO_FILTERS } from '../lib/searchDefaults'

export interface AreaStats {
  total: number
  magazines: number
  /** Artigos dos ultimos 3 anos; so existe quando pedido */
  recent?: number
}

/** Cada area e uma busca pelo termo dela; o backend ainda nao classifica por area. */
export function useAreaStats(withRecent: boolean) {
  const [stats, setStats] = useState<Record<string, AreaStats>>({})

  useEffect(() => {
    let active = true
    const from = new Date().getFullYear() - 2
    Promise.all(
      AREAS.map(async (area) => {
        try {
          const res = await searchArticles({ query: area.term, searchType: 'simple', filters: NO_FILTERS, page: 1, limit: 1 })
          const magazines = (res.facets?.by_magazine ?? []).filter((m) => m.count > 0).length
          let recent: number | undefined
          if (withRecent) {
            const r = await searchArticles({
              query: area.term,
              searchType: 'simple',
              filters: { ...NO_FILTERS, year_from: from },
              page: 1,
              limit: 1,
            })
            recent = r.total
          }
          return [area.slug, { total: res.total, magazines, recent }] as const
        } catch {
          return null
        }
      }),
    ).then((entries) => {
      if (!active) return
      setStats(Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => e !== null)))
    })
    return () => {
      active = false
    }
  }, [withRecent])

  return stats
}
