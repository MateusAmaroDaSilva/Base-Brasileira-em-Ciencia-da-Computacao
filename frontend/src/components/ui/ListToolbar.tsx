import { ChevronDown, Search } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface ListToolbarProps {
  query: string
  onQuery: (v: string) => void
  placeholder: string
  sort: string
  onSort: (v: string) => void
  sortOptions: Option[]
  chips: Option[]
  chip: string
  onChip: (v: string) => void
}

/** Busca, ordenacao e filtros rapidos das telas Revistas e Areas. */
export default function ListToolbar({
  query,
  onQuery,
  placeholder,
  sort,
  onSort,
  sortOptions,
  chips,
  chip,
  onChip,
}: ListToolbarProps) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="flex-1 min-w-0 h-12 bg-white border border-linha rounded-[10px] flex items-center gap-3 px-4 focus-within:border-brand-300">
          <Search className="w-[18px] h-[18px] text-tinta shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px]"
          />
        </label>
        <span className="relative inline-flex items-center sm:w-[200px]">
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            aria-label="Ordenar"
            className="appearance-none h-12 w-full pl-4 pr-10 rounded-[10px] bg-white border border-linha text-[15px]
                       font-semibold text-brand-600 cursor-pointer hover:border-brand-300 transition-colors"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3.5 pointer-events-none" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros rápidos">
        {chips.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={chip === c.value}
            onClick={() => onChip(c.value)}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold border transition-colors ${
              chip === c.value
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-linha text-brand-600 hover:border-brand-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}
