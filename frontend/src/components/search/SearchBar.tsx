import { useState, useRef, useEffect } from 'react'
import { Search, HelpCircle, X } from 'lucide-react'
import type { SearchType } from '../../types'

interface SearchBarProps {
  onSearch: (query: string, searchType: SearchType) => void
  initialQuery?: string
  initialType?: SearchType
  loading?: boolean
}

const BOOLEAN_EXAMPLES = [
  { label: 'AND — ambos os termos', example: 'redes neurais AND aprendizado' },
  { label: 'OR — qualquer um dos termos', example: 'machine learning OR aprendizado de máquina' },
  { label: 'NOT — excluir termo', example: 'inteligência artificial NOT robótica' },
  { label: 'Aspas — frase exata', example: '"processamento de linguagem natural"' },
  { label: 'Agrupamento', example: '(redes OR grafos) AND algoritmos' },
]

export default function SearchBar({ onSearch, initialQuery = '', initialType = 'simple', loading = false }: SearchBarProps) {
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
      ? 'Ex: "machine learning" AND redes OR "deep learning" NOT hardware'
      : 'Buscar por título, autores, palavras-chave, resumo...'

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search type toggle */}
      <div className="flex items-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => setSearchType('simple')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            searchType === 'simple'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          Busca Simples
        </button>
        <button
          type="button"
          onClick={() => setSearchType('boolean')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            searchType === 'boolean'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          Busca Booleana
        </button>

        {searchType === 'boolean' && (
          <div className="relative ml-1" ref={helpRef}>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              className="text-slate-400 hover:text-blue-600 transition-colors"
              aria-label="Ajuda sobre busca booleana"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {showHelp && (
              <div className="absolute top-7 left-0 z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Sintaxe da Busca Booleana
                </p>
                <ul className="space-y-2.5">
                  {BOOLEAN_EXAMPLES.map((ex) => (
                    <li key={ex.label}>
                      <p className="text-xs text-slate-500 mb-0.5">{ex.label}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(ex.example)
                          setShowHelp(false)
                          inputRef.current?.focus()
                        }}
                        className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors text-left w-full"
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

      {/* Search input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800
                       placeholder:text-slate-400 focus:outline-none focus:border-blue-500
                       text-sm shadow-sm transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white
                     font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap text-sm"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {searchType === 'boolean' && (
        <p className="mt-2 text-xs text-slate-500 text-center">
          Use <span className="font-semibold text-slate-700">AND</span>,{' '}
          <span className="font-semibold text-slate-700">OR</span>,{' '}
          <span className="font-semibold text-slate-700">NOT</span> em maiúsculas e aspas para frases exatas.
          Clique em <HelpCircle className="inline w-3 h-3" /> para exemplos.
        </p>
      )}
    </div>
  )
}
