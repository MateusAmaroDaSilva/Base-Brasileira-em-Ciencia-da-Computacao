import { apiClient } from './client'
import type { Magazine } from '../types'

export async function fetchMagazines(): Promise<Magazine[]> {
  const { data } = await apiClient.get<Magazine[]>('/magazines/')
  return data
}

export async function fetchMagazineById(id: number): Promise<Magazine> {
  const { data } = await apiClient.get<Magazine>(`/magazines/${id}`)
  return data
}

export interface MagazineStatsDto {
  magazine_id: number
  articles: number
  first_year: number | null
  last_year: number | null
  issues: number | null
  with_doi: number
  issn: string | null
  types: Record<string, number>
}

export async function fetchMagazineStats(): Promise<MagazineStatsDto[]> {
  const { data } = await apiClient.get<MagazineStatsDto[]>('/magazines/stats')
  return data
}
