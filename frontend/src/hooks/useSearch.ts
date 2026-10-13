import { useState, useCallback, useRef } from 'react'
import { searchArticles } from '../api/articles'
import type { Article, SearchFilters, SearchFacets, SearchType } from '../types'

const DEFAULT_ITEMS_PER_PAGE = 10

export interface SearchState {
  articles: Article[]
  total: number
  facets: SearchFacets | undefined
  loading: boolean
  error: string | null
  page: number
  query: string
  searchType: SearchType
  filters: SearchFilters
  hasSearched: boolean
  limit: number
}

const defaultFilters: SearchFilters = {
  magazine_id: null,
  year_from: null,
  year_to: null,
  language: null,
  keyword: null,
  has_doi: null,
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    articles: [],
    total: 0,
    facets: undefined,
    loading: false,
    error: null,
    page: 1,
    query: '',
    searchType: 'simple',
    filters: defaultFilters,
    hasSearched: false,
    limit: DEFAULT_ITEMS_PER_PAGE,
  })

  const abortRef = useRef<AbortController | null>(null)

  const doSearch = useCallback(
    async (query: string, searchType: SearchType, filters: SearchFilters, page: number, limit: number) => {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const result = await searchArticles({
          query,
          searchType,
          filters,
          page,
          limit,
        })

        setState((prev) => ({
          ...prev,
          articles: result.articles,
          total: result.total,
          facets: result.facets,
          loading: false,
          hasSearched: true,
          page,
        }))
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') return

        let errorMsg = 'Erro ao realizar a busca.'
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status: number; data?: { detail?: string } } }
          if (axiosErr.response) {
            const detail = axiosErr.response.data?.detail
            errorMsg = `Erro ${axiosErr.response.status}: ${detail ?? 'Resposta inválida do servidor.'}`
          } else if ('message' in err) {
            errorMsg = `Erro de rede: ${(err as { message: string }).message}`
          }
        } else if (err instanceof Error) {
          errorMsg = `Erro: ${err.message}`
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
          articles: [],
          total: 0,
          facets: undefined,
          hasSearched: true,
        }))
      }
    },
    [],
  )

  const search = useCallback(
    (query: string, searchType?: SearchType, filters?: SearchFilters) => {
      const type = searchType ?? state.searchType
      const f = filters ?? state.filters
      setState((prev) => ({ ...prev, query, searchType: type, filters: f, page: 1 }))
      doSearch(query, type, f, 1, state.limit)
    },
    [state.searchType, state.filters, state.limit, doSearch],
  )

  const setPage = useCallback(
    (page: number) => {
      doSearch(state.query, state.searchType, state.filters, page, state.limit)
    },
    [state.query, state.searchType, state.filters, state.limit, doSearch],
  )

  const setFilters = useCallback(
    (filters: SearchFilters) => {
      setState((prev) => ({ ...prev, filters, page: 1 }))
      doSearch(state.query, state.searchType, filters, 1, state.limit)
    },
    [state.query, state.searchType, state.limit, doSearch],
  )

  const setLimit = useCallback(
    (limit: number) => {
      setState((prev) => ({ ...prev, limit, page: 1 }))
      doSearch(state.query, state.searchType, state.filters, 1, limit)
    },
    [state.query, state.searchType, state.filters, doSearch],
  )

  const setSearchType = useCallback((searchType: SearchType) => {
    setState((prev) => ({ ...prev, searchType }))
  }, [])

  const totalPages = Math.ceil(state.total / state.limit)

  return {
    ...state,
    totalPages,
    itemsPerPage: state.limit,
    search,
    setPage,
    setFilters,
    setSearchType,
    setLimit,
  }
}
