import { useState, useEffect } from 'react'
import { fetchMagazines } from '../api/magazines'
import type { Magazine } from '../types'

export function useMagazines() {
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMagazines()
      .then(setMagazines)
      .catch(() => setMagazines([]))
      .finally(() => setLoading(false))
  }, [])

  return { magazines, loading }
}
