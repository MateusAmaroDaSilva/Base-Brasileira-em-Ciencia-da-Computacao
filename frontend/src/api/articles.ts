import { apiClient } from './client'
import type { Article, SearchResponse, SearchFilters, SearchType } from '../types'

interface SearchParams {
  query: string
  searchType: SearchType
  filters: SearchFilters
  page: number
  limit: number
}

export async function searchArticles(params: SearchParams): Promise<SearchResponse> {
  const { query, searchType, filters, page, limit } = params
  const offset = (page - 1) * limit

  const useElastic = searchType === 'boolean'
  const endpoint = useElastic ? '/articles/elasticsearch/search' : '/articles/search'

  const body: Record<string, unknown> = {
    query,
    search_type: searchType,
    limit,
    offset,
  }

  if (filters.magazine_id) body.magazine_id = filters.magazine_id
  if (filters.year_from) body.year_from = filters.year_from
  if (filters.year_to) body.year_to = filters.year_to
  if (filters.language) body.language = filters.language

  const { data } = await apiClient.post<SearchResponse>(endpoint, body)
  return data
}

export async function fetchArticleById(id: number): Promise<Article> {
  const { data } = await apiClient.get<Article>(`/articles/${id}`)
  return data
}

export async function fetchSuggestions(q: string, limit = 5): Promise<string[]> {
  const { data } = await apiClient.get<{ suggestions: string[] }>('/articles/elasticsearch/suggest', {
    params: { q, limit },
  })
  return data.suggestions ?? []
}

function hasBoolean(query: string): boolean {
  const tokens = query.split(/\s+/)
  return tokens.some((t) => ['AND', 'OR', 'NOT'].includes(t)) || query.includes('"') || query.includes('(')
}
