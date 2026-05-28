export interface Magazine {
  id: number
  name: string
  url_oai_pmh: string
  description?: string
  is_active: boolean
  last_sync?: string
  created_at: string
}

export interface Article {
  id: number
  oai_identifier: string
  magazine_id: number
  title: string
  authors: string[]
  abstract?: string
  keywords: string[]
  publication_date?: string
  url?: string
  doi?: string
  created_at: string
}

export interface MagazineFacet {
  id: number
  count: number
}

export interface YearFacet {
  year: string
  count: number
}

export interface LanguageFacet {
  code: string
  count: number
}

export interface KeywordFacet {
  keyword: string
  count: number
}

export interface DoiFacet {
  value: string
  label: string
  count: number
}

export interface SearchFacets {
  by_magazine?: MagazineFacet[]
  by_year?: YearFacet[]
  by_language?: LanguageFacet[]
  by_keyword?: KeywordFacet[]
  by_doi?: DoiFacet[]
  search_engine?: string
  total_results?: number
  limit?: number
  offset?: number
}

export interface SearchResponse {
  total: number
  articles: Article[]
  facets?: SearchFacets
}

export type SearchType = 'simple' | 'boolean'

export interface SearchFilters {
  magazine_id: number | null
  year_from: number | null
  year_to: number | null
  language: string | null
  keyword: string | null
  has_doi: boolean | null
}
