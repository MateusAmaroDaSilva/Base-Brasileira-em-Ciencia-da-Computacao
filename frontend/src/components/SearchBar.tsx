import { ChangeEvent } from 'react'

interface SearchBarProps {
  query: string
  onSearch: (query: string) => void
}

export default function SearchBar({ query, onSearch }: SearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  const handleClear = () => {
    onSearch('')
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🔍 Buscar Artigos
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="Digite título, autor ou palavras-chave..."
          value={query}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        A busca é executada em tempo real
      </p>
    </div>
  )
}
