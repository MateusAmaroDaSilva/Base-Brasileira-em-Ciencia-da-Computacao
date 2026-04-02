import { useState } from 'react'

interface FiltersProps {
  magazines: { id: number; title: string }[]
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  magazine_id: number | null
  date_from: string
  date_to: string
}

export default function Filters({ magazines, onFilterChange }: FiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    magazine_id: null,
    date_from: '',
    date_to: '',
  })

  const handleMagazineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null
    const newFilters = { ...filters, magazine_id: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, date_from: e.target.value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, date_to: e.target.value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      magazine_id: null,
      date_from: '',
      date_to: '',
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">🔎 Filtros Avançados</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Limpar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📚 Revista
          </label>
          <select
            value={filters.magazine_id || ''}
            onChange={handleMagazineChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas as revistas</option>
            {magazines.map((mag) => (
              <option key={mag.id} value={mag.id}>
                {mag.title}
              </option>
            ))}
          </select>
        </div>

        {/* Data de */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📅 De
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={handleDateFromChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Data até */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📅 Até
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={handleDateToChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  )
}
