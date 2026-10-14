import { useEffect, useState } from 'react'
import { fetchMagazineStats } from '../api/magazines'
import type { Magazine } from '../types'

export interface MagazineStats {
  total: number
  /** Primeiro ano com publicacao; ausente enquanto a revista nao tem datas */
  since?: number
  /** Numero de edicoes (volume + numero); ausente enquanto a revista nao informa */
  issues?: number
  withDoi: number
  issn?: string
}

/** Numeros de todas as revistas, vindos do servidor numa chamada so. */
export function useMagazineStats(magazines: Magazine[]) {
  const [stats, setStats] = useState<Record<number, MagazineStats>>({})

  useEffect(() => {
    if (magazines.length === 0) return
    let active = true
    fetchMagazineStats()
      .then((rows) => {
        if (!active) return
        setStats(
          Object.fromEntries(
            rows.map((r) => [
              r.magazine_id,
              {
                total: r.articles,
                since: r.first_year ?? undefined,
                issues: r.issues ?? undefined,
                withDoi: r.with_doi,
                issn: r.issn ?? undefined,
              },
            ]),
          ),
        )
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [magazines])

  return stats
}
