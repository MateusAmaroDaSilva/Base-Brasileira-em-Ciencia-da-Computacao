import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Database, Zap, SlidersHorizontal } from 'lucide-react'
import SearchBar from '../components/search/SearchBar'
import MetadataSidebar, { FilterChips, countActiveFilters } from '../components/filters/MetadataSidebar'
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

  const [filtersOpen, setFiltersOpen] = useState(false)

  // Com a gaveta de filtros aberta, a pagina atras dela nao deve rolar
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [filtersOpen])

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
  const activeFilters = countActiveFilters(filters)

  function pageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (page > 3) pages.push('…')
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  const filterPanel = (onClose?: () => void) => (
    <MetadataSidebar
      magazines={magazines}
      filters={filters}
      onFilterChange={setFilters}
      magazineFacets={facets?.by_magazine}
      yearFacets={facets?.by_year}
      languageFacets={facets?.by_language}
      keywordFacets={facets?.by_keyword}
      doiFacets={facets?.by_doi}
      onClose={onClose}
    />
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Area de busca: grande na abertura, compacta depois da primeira pesquisa */}
      <section
        className={
          hasSearched
            ? 'bg-white border-b border-slate-200 py-4 sm:py-5'
            : 'bg-white border-b border-slate-200 py-12 sm:py-20'
        }
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasSearched && (
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
                Pesquise a produção científica brasileira em Computação
              </h1>
              <p className="mt-3 text-slate-500 text-base sm:text-lg max-w-2xl mx-auto">
                Artigos de periódicos nacionais reunidos em um único lugar, com busca por título,
                autor, palavra-chave e resumo.
              </p>
            </div>
          )}

          <SearchBar
            onSearch={handleSearch}
            initialQuery={query}
            initialType={searchType}
            loading={loading}
            compact={hasSearched}
          />
        </div>
      </section>

      <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {error && (
          <div role="alert" className="mb-5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!error && hasSearched && facets?.search_engine === 'sql_fallback' && !loading && (
          <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl
                          text-sm flex items-start gap-2">
            <Database className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Busca por texto simples: os operadores booleanos não estão disponíveis no momento.
            </span>
          </div>
        )}

        {hasSearched && (
          <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8 lg:items-start">
            {/* Filtros fixos na lateral, apenas em telas grandes */}
            <aside className="hidden lg:block lg:sticky lg:top-20">{filterPanel()}</aside>

            <div className="min-w-0">
              {/* Cabecalho dos resultados */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <p className="text-sm text-slate-600">
                  {loading ? (
                    <span className="animate-pulse">Buscando…</span>
                  ) : (
                    <>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {total.toLocaleString('pt-BR')}
                      </span>{' '}
                      {total === 1 ? 'artigo encontrado' : 'artigos encontrados'}
                      {total > 0 && (
                        <span className="text-slate-400">
                          {' '}· {offset + 1}–{Math.min(offset + itemsPerPage, total)}
                        </span>
                      )}
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  {!loading && total > 0 && isElastic && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-700
                                     bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      <Zap className="w-3 h-3" aria-hidden="true" />
                      Busca avançada
                    </span>
                  )}

                  {/* Abre os filtros como gaveta no celular */}
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 text-sm font-medium text-slate-700
                               bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-card
                               hover:border-brand-300 transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                    Filtros
                    {activeFilters > 0 && (
                      <span className="text-xs font-semibold text-white bg-brand-600 rounded-full px-1.5 tabular-nums">
                        {activeFilters}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {activeFilters > 0 && (
                <div className="mb-4">
                  <FilterChips filters={filters} magazines={magazines} onFilterChange={setFilters} />
                </div>
              )}

              <ArticleList
                articles={articles}
                magazines={magazines}
                loading={loading}
                onArticleClick={(id) => navigate(`/article/${id}`)}
              />

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

                  {/* No celular basta saber em que pagina se esta */}
                  <span className="sm:hidden text-sm text-slate-600 px-3 tabular-nums">
                    Página {page} de {totalPages}
                  </span>

                  <span className="hidden sm:flex items-center gap-1">
                    {pageNumbers().map((p, i) =>
                      p === '…' ? (
                        <span key={`e-${i}`} className="px-2 text-slate-400 select-none">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          aria-current={page === p ? 'page' : undefined}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors tabular-nums ${
                            page === p
                              ? 'bg-brand-600 text-white shadow-card'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </span>

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

        {/* Abertura: revistas disponiveis */}
        {!hasSearched && !loading && magazines.length > 0 && (
          <section className="max-w-4xl mx-auto mt-6">
            <h2 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Revistas indexadas
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {magazines.map((m) => (
                <li
                  key={m.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-card px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  {m.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Gaveta de filtros no celular */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-slate-50 p-3 pb-6">
            {filterPanel(() => setFiltersOpen(false))}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-3 w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold
                         rounded-xl transition-colors"
            >
              Ver {total.toLocaleString('pt-BR')} {total === 1 ? 'resultado' : 'resultados'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
