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
