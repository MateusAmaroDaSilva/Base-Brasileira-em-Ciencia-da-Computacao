import { apiClient } from './client'

export interface SiteStats {
  articles: number
  magazines: number
  authors: number
  institutions: number | null
  last_sync: string | null
}

export interface TrendingSearch {
  query: string
  /** Usuarios diferentes que fizeram a busca; ausente nos temas de exemplo */
  users: number | null
}

export const fetchStats = () => apiClient.get<SiteStats>('/stats').then((r) => r.data)

export const fetchTrending = (limit = 4) =>
  apiClient.get<TrendingSearch[]>('/searches/trending', { params: { limit } }).then((r) => r.data)
