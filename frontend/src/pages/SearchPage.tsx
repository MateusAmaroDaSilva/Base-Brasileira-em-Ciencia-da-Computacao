import { useState, useEffect } from 'react'
import axios from 'axios'
import SearchBar from '../components/SearchBar'
import ArticleList from '../components/ArticleList'
import Filters, { FilterState } from '../components/Filters'
import { useNavigate } from 'react-router-dom'

interface Article {
  id: number
  title: string
  authors: string[]
  published_date: string
  magazine_id: number
  abstract?: string
  keywords?: string[]
  url?: string
  doi?: string
  oai_identifier: string
}

interface Magazine {
  id: number
  title: string
  oai_pmh_url?: string
}

interface SearchResponse {
  total: number
  articles: Article[]
}

const API_BASE_URL = 'http://localhost:8000/api/v1'
const ITEMS_PER_PAGE = 20

export default function SearchPage() {
  const navigate = useNavigate()

  // State
  const [articles, setArticles] = useState<Article[]>([])
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    magazine_id: null,
    date_from: '',
    date_to: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  // Computed
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE)
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  // Effects
  useEffect(() => {
    fetchMagazines()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchArticles()
  }, [searchQuery, filters])

  useEffect(() => {
    fetchArticles()
  }, [currentPage])

  // Handlers
  const fetchMagazines = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/magazines`)
      setMagazines(response.data)
    } catch (err) {
      setError('Erro ao carregar revistas')
      console.error(err)
    }
  }

  const fetchArticles = async () => {
    setLoading(true)
    setError(null)
    try {
      const searchPayload = {
        query: searchQuery,
        magazine_id: filters.magazine_id,
        date_from: filters.date_from ? `${filters.date_from}T00:00:00` : null,
        date_to: filters.date_to ? `${filters.date_to}T23:59:59` : null,
        offset: offset,
        limit: ITEMS_PER_PAGE,
      }

      // Remove null values
      const cleanedPayload = Object.fromEntries(
        Object.entries(searchPayload).filter(([, v]) => v !== null)
      )

      const response = await axios.post<SearchResponse>(
        `${API_BASE_URL}/articles/search`,
        cleanedPayload
      )

      setArticles(response.data.articles)
      setTotalResults(response.data.total)
    } catch (err) {
      setError('Erro ao carregar artigos. Tente novamente.')
      console.error(err)
      setArticles([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleArticleClick = (articleId: number) => {
    navigate(`/article/${articleId}`)
  }

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(newPage)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            📚 Base Brasileira em Ciência da Computação
          </h1>
          <p className="text-gray-600 mt-2">
            Explore uma vasta coleção de artigos científicos brasileiros
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar query={searchQuery} onSearch={setSearchQuery} />
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Filters magazines={magazines} onFilterChange={handleFilterChange} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Results Info */}
        {totalResults > 0 && (
          <div className="mb-6 text-sm text-gray-600">
            Mostrando <span className="font-semibold">{offset + 1}</span> até{' '}
            <span className="font-semibold">
              {Math.min(offset + ITEMS_PER_PAGE, totalResults)}
            </span>{' '}
            de <span className="font-semibold">{totalResults}</span> resultados
          </div>
        )}

        {/* Articles List */}
        <ArticleList
          articles={articles}
          onArticleClick={handleArticleClick}
          isLoading={loading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-between">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - currentPage)
                  return distance <= 2 || page === 1 || page === totalPages
                })
                .map((page, idx, arr) => {
                  const items = []

                  // Add ellipsis if needed
                  if (idx > 0 && arr[idx - 1] !== page - 1) {
                    items.push(
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-600">
                        ...
                      </span>
                    )
                  }

                  items.push(
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      disabled={loading}
                      className={`px-3 py-2 rounded-lg transition ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-indigo-600 hover:bg-indigo-50'
                      } disabled:cursor-not-allowed`}
                    >
                      {page}
                    </button>
                  )

                  return items
                })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Próxima →
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            © 2026 Base Brasileira em Ciência da Computação. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
