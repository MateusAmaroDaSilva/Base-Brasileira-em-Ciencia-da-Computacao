import { useEffect, useState } from 'react'
import { searchArticles } from '../api/articles'
import { NO_FILTERS } from '../lib/searchDefaults'
import type { Magazine } from '../types'

export interface MagazineStats {
  total: number
  /** Primeiro ano com publicacao; ausente enquanto a revista nao tem datas */
  since?: number
  withDoi: number
}

/** Um pedido por revista: total, primeiro ano e quantos artigos tem DOI. */
export function useMagazineStats(magazines: Magazine[]) {
  const [stats, setStats] = useState<Record<number, MagazineStats>>({})

  useEffect(() => {
    if (magazines.length === 0) return
    let active = true
    Promise.all(
      magazines.map((m) =>
        searchArticles({
          query: '',
          searchType: 'simple',
          filters: { ...NO_FILTERS, magazine_id: m.id },
          page: 1,
          limit: 1,
        })
          .then((res) => {
            const years = (res.facets?.by_year ?? []).map((y) => Number(y.year)).filter((y) => !isNaN(y))
            const withDoi = res.facets?.by_doi?.find((d) => d.value === 'com_doi')?.count ?? 0
            return [m.id, { total: res.total, since: years.length ? Math.min(...years) : undefined, withDoi }] as const
          })
          .catch(() => null),
      ),
    ).then((entries) => {
      if (!active) return
      setStats(Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => e !== null)))
    })
    return () => {
      active = false
    }
  }, [magazines])

  return stats
}
