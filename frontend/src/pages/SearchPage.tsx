import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Database, Zap } from 'lucide-react'
import SearchBar from '../components/search/SearchBar'
import MetadataSidebar from '../components/filters/MetadataSidebar'
import ArticleList from '../components/articles/ArticleList'
import { useSearch } from '../hooks/useSearch'
import { useMagazines } from '../hooks/useMagazines'
import type { SearchType } from '../types'

export default function SearchPage() {
  const navigate = useNavigate()
  const { magazines } = useMagazines()
  const {
    articles, total, facets, loading, error,
    page, totalPages, itemsPerPage,
    query, searchType, filters, hasSearched,
    search, setPage, setFilters, setSearchType,
  } = useSearch()

  function handleSearch(q: string, type: SearchType) {
    setSearchType(type)
    search(q, type, filters)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const offset = (page - 1) * itemsPerPage
  const isElastic = facets?.search_engine === 'elasticsearch'
  const showSidebar = hasSearched && !loading

  function pageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (page > 3) pages.push('…')
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero / Search area */}
      <div className={`transition-all duration-500 ${hasSearched ? 'py-6 border-b border-slate-200 bg-white shadow-sm' : 'py-20'}`}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasSearched && (
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                Pesquise Ciência da Computação Brasileira
              </h1>
              <p className="text-slate-500 text-lg">
                Acervo de artigos científicos de 5 revistas nacionais via OAI-PMH
              </p>
            </div>
          )}
          <SearchBar
            onSearch={handleSearch}
            initialQuery={query}
            initialType={searchType}
            loading={loading}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {hasSearched && (
          <div className="flex gap-6">
            {/* Sidebar */}
            {showSidebar && (
              <MetadataSidebar
                magazines={magazines}
                filters={filters}
                onFilterChange={setFilters}
                magazineFacets={facets?.by_magazine}
                yearFacets={facets?.by_year}
              />
            )}

            {/* Results area */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-600">
                    {loading ? (
                      <span className="animate-pulse">Buscando...</span>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-900">{total.toLocaleString('pt-BR')}</span>
                        {' '}artigo{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                        {total > 0 && (
                          <span className="text-slate-400 ml-1">
                            · mostrando {offset + 1}–{Math.min(offset + itemsPerPage, total)}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  {isElastic && !loading && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50
                                     border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      <Zap className="w-3 h-3" />
                      Elasticsearch
                    </span>
                  )}
                  {!isElastic && !loading && total > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100
                                     border border-slate-200 px-2 py-0.5 rounded-full">
                      <Database className="w-3 h-3" />
                      SQL
                    </span>
                  )}
                </div>
              </div>

              {/* Articles */}
              <ArticleList
                articles={articles}
                magazines={magazines}
                loading={loading}
                onArticleClick={(id) => navigate(`/article/${id}`)}
              />

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Paginação">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30
                               disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {pageNumbers().map((p, i) =>
                    p === '…' ? (
                      <span key={`e-${i}`} className="px-2 text-slate-400 select-none">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30
                               disabled:cursor-not-allowed transition-colors"
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              )}
            </div>
          </div>
        )}

        {/* Initial state (no search yet) */}
        {!hasSearched && !loading && (
          <div className="max-w-2xl mx-auto mt-8">
            <p className="text-center text-sm font-medium text-slate-500 mb-4">Revistas indexadas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {magazines.map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 text-center shadow-sm">
                  <p className="text-sm font-semibold text-slate-700 truncate">{m.name}</p>
                  {m.description && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{m.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
