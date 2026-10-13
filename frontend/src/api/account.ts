import { apiClient } from './client'
import type { Alert, AuthResponse, HistoryEntry, SavedArticle, TopSearch, User } from '../types'

export interface RegisterData {
  name: string
  email: string
  institution?: string
  areas: string[]
  password: string
  accept_terms: boolean
}

export const register = (data: RegisterData) => apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data)

export const login = (email: string, password: string, remember: boolean) =>
  apiClient.post<AuthResponse>('/auth/login', { email, password, remember }).then((r) => r.data)

export const fetchMe = () => apiClient.get<User>('/me').then((r) => r.data)

export const updateMe = (patch: Partial<Pick<User, 'name' | 'institution' | 'areas' | 'save_history'>>) =>
  apiClient.patch<User>('/me', patch).then((r) => r.data)

export const fetchHistory = (params?: { days?: number; q?: string; limit?: number }) =>
  apiClient.get<HistoryEntry[]>('/me/history', { params }).then((r) => r.data)

export const addHistory = (data: { query: string; area?: string | null; result_count?: number | null }) =>
  apiClient.post<HistoryEntry | null>('/me/history', data).then((r) => r.data)

export const deleteHistoryEntry = (id: number) => apiClient.delete(`/me/history/${id}`)

export const clearHistory = () => apiClient.delete('/me/history')

export const fetchTopSearches = (limit = 4) =>
  apiClient.get<TopSearch[]>('/me/history/top', { params: { limit } }).then((r) => r.data)

export const fetchSaved = () => apiClient.get<SavedArticle[]>('/me/saved').then((r) => r.data)

export const fetchSavedIds = () => apiClient.get<number[]>('/me/saved/ids').then((r) => r.data)

export const saveArticle = (id: number) => apiClient.put(`/me/saved/${id}`)

export const unsaveArticle = (id: number) => apiClient.delete(`/me/saved/${id}`)

export const fetchAlerts = () => apiClient.get<Alert[]>('/me/alerts').then((r) => r.data)

export const createAlert = (query: string) => apiClient.post<Alert>('/me/alerts', { query }).then((r) => r.data)

export const deleteAlert = (id: number) => apiClient.delete(`/me/alerts/${id}`)

// O corpo e a propria imagem (ja reduzida); o servidor confere o tipo pelo conteudo
export const uploadAvatar = (image: Blob) =>
  apiClient.put<User>('/me/avatar', image, { headers: { 'Content-Type': image.type || 'application/octet-stream' } }).then((r) => r.data)

export const removeAvatar = () => apiClient.delete('/me/avatar')
