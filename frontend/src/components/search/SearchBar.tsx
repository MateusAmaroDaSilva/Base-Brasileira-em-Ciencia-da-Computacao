import { useState, useRef, useEffect } from 'react'
import { Search, HelpCircle, X } from 'lucide-react'
import type { SearchType } from '../../types'

interface SearchBarProps {
  onSearch: (query: string, searchType: SearchType) => void
  initialQuery?: string
  initialType?: SearchType
  loading?: boolean
  compact?: boolean
}

const BOOLEAN_EXAMPLES = [
  { label: 'AND — ambos os termos', example: 'redes neurais AND aprendizado' },
  { label: 'OR — qualquer um dos termos', example: 'machine learning OR aprendizado de máquina' },
  { label: 'NOT — excluir termo', example: 'inteligência artificial NOT robótica' },
  { label: 'Aspas — frase exata', example: '"processamento de linguagem natural"' },
  { label: 'Agrupamento', example: '(redes OR grafos) AND algoritmos' },
]

export default function SearchBar({
  onSearch,
  initialQuery = '',
  initialType = 'simple',
  loading = false,
  compact = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<SearchType>(initialType)
  const [showHelp, setShowHelp] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelp(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch(query.trim(), searchType)
  }

  function handleClear() {
    setQuery('')
    inputRef.current?.focus()
  }

  const placeholder =
    searchType === 'boolean'
      ? 'Ex.: "machine learning" AND redes NOT hardware'
      : 'Busque por título, autor, palavra-chave ou resumo'

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Alternador de tipo de busca — controle segmentado */}
      <div className="flex items-center gap-2 mb-3">
        <div
          role="tablist"
          aria-label="Tipo de busca"
          className="inline-flex p-0.5 bg-brand-50 rounded-lg border border-brand-100"
        >
          {(['simple', 'boolean'] as const).map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={searchType === type}
              onClick={() => setSearchType(type)}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                searchType === type
                  ? 'bg-white text-brand-800 shadow-sm'
                  : 'text-tinta/70 hover:text-tinta'
              }`}
            >
              {type === 'simple' ? 'Busca simples' : 'Busca booleana'}
            </button>
          ))}
        </div>

        {searchType === 'boolean' && (
          <div className="relative" ref={helpRef}>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              className="flex items-center text-tinta/50 hover:text-brand-600 transition-colors p-1"
              aria-label="Ajuda sobre busca booleana"
              aria-expanded={showHelp}
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {showHelp && (
              <div
                className="absolute top-8 left-0 z-50 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-xl
                           shadow-xl border border-brand-100 p-4"
              >
                <p className="text-xs font-semibold text-tinta/70 uppercase tracking-wide mb-3">
                  Como montar a busca
                </p>
                <ul className="space-y-2.5">
                  {BOOLEAN_EXAMPLES.map((ex) => (
                    <li key={ex.label}>
                      <p className="text-xs text-tinta/70 mb-0.5">{ex.label}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(ex.example)
                          setShowHelp(false)
                          inputRef.current?.focus()
                        }}
                        className="w-full text-left text-xs font-mono text-brand-700 bg-brand-50 px-2 py-1
                                   rounded hover:bg-brand-100 transition-colors break-anywhere"
                      >
                        {ex.example}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campo de busca — no celular o botao ocupa a largura toda */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-tinta/50 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Termo de busca"
            /* text-base no celular evita o zoom automatico do iOS ao focar o campo */
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-brand-200 bg-white text-brand-700
                       placeholder:text-tinta/50 text-base sm:text-sm shadow-card
                       focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none
                       transition-colors [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tinta/50 hover:text-tinta
                         transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300
                     text-white font-semibold rounded-xl shadow-card transition-colors
                     whitespace-nowrap text-sm"
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {searchType === 'boolean' && !compact && (
        <p className="mt-2 text-xs text-tinta/70 text-center">
          Combine termos com <span className="font-semibold text-tinta">AND</span>,{' '}
          <span className="font-semibold text-tinta">OR</span> e{' '}
          <span className="font-semibold text-tinta">NOT</span> em maiúsculas; use aspas para frases exatas.
        </p>
      )}
    </div>
  )
}
