import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { Magazine, SearchFilters, MagazineFacet, YearFacet } from '../../types'

interface MetadataSidebarProps {
  magazines: Magazine[]
  filters: SearchFilters
  onFilterChange: (filters: SearchFilters) => void
  magazineFacets?: MagazineFacet[]
  yearFacets?: YearFacet[]
}

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 px-4 text-sm font-semibold
                   text-slate-700 hover:text-slate-900 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

export default function MetadataSidebar({
  magazines,
  filters,
  onFilterChange,
  magazineFacets = [],
  yearFacets = [],
}: MetadataSidebarProps) {
  const hasActiveFilters =
    filters.magazine_id !== null ||
    filters.year_from !== null ||
    filters.year_to !== null ||
    filters.language !== null

  const magMap = Object.fromEntries(magazines.map((m) => [m.id, m.name]))

  const countByMag: Record<number, number> = {}
  magazineFacets.forEach((f) => {
    countByMag[f.id] = f.count
  })

  // Year range from facets
  const years = yearFacets
    .map((f) => parseInt(f.year))
    .filter((y) => !isNaN(y))
    .sort()
  const minYear = years[0] ?? 2000
  const maxYear = years[years.length - 1] ?? new Date().getFullYear()

  function clearFilters() {
    onFilterChange({ magazine_id: null, year_from: null, year_to: null, language: null })
  }

  function setMagazine(id: number | null) {
    onFilterChange({ ...filters, magazine_id: id })
  }

  function setYearFrom(v: string) {
    onFilterChange({ ...filters, year_from: v ? parseInt(v) : null })
  }

  function setYearTo(v: string) {
    onFilterChange({ ...filters, year_to: v ? parseInt(v) : null })
  }

  function setLanguage(lang: string | null) {
    onFilterChange({ ...filters, language: lang })
  }

  // Show magazines that have results (from facets) or all if no facets
  const displayedMagazines = magazineFacets.length > 0
    ? magazines.filter((m) => countByMag[m.id] !== undefined)
    : magazines

  return (
    <aside className="w-64 shrink-0">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Refinar Busca</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>

        {/* Active filters chips */}
        {hasActiveFilters && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-slate-100">
            {filters.magazine_id && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                {magMap[filters.magazine_id] ?? `Revista ${filters.magazine_id}`}
                <button onClick={() => setMagazine(null)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.year_from || filters.year_to) && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                {filters.year_from ?? '—'} – {filters.year_to ?? '—'}
                <button onClick={() => onFilterChange({ ...filters, year_from: null, year_to: null })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.language && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                {LANGUAGES.find((l) => l.code === filters.language)?.label ?? filters.language}
                <button onClick={() => setLanguage(null)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Revista */}
        <Section title="Revista" defaultOpen>
          <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
            <li>
              <button
                type="button"
                onClick={() => setMagazine(null)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                  filters.magazine_id === null
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todas as revistas
              </button>
            </li>
            {displayedMagazines.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setMagazine(filters.magazine_id === m.id ? null : m.id)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    filters.magazine_id === m.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{m.name}</span>
                  {countByMag[m.id] !== undefined && (
                    <span className="ml-1 shrink-0 text-xs text-slate-400 tabular-nums">
                      {countByMag[m.id]}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Section>

        {/* Período */}
        <Section title="Período" defaultOpen>
          {yearFacets.length > 0 && (
            <p className="text-xs text-slate-400 mb-2">
              Artigos disponíveis: {minYear} – {maxYear}
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1990}
              max={maxYear}
              placeholder="De"
              value={filters.year_from ?? ''}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg
                         focus:outline-none focus:border-blue-500 text-slate-700 transition-colors"
            />
            <span className="text-slate-400 text-xs shrink-0">até</span>
            <input
              type="number"
              min={1990}
              max={maxYear}
              placeholder="Até"
              value={filters.year_to ?? ''}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg
                         focus:outline-none focus:border-blue-500 text-slate-700 transition-colors"
            />
          </div>
          {yearFacets.length > 0 && (
            <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
              {[...yearFacets].reverse().map((f) => (
                <button
                  key={f.year}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      year_from: parseInt(f.year),
                      year_to: parseInt(f.year),
                    })
                  }
                  className="w-full flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <span>{f.year}</span>
                  <span className="text-slate-400 tabular-nums">{f.count}</span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Idioma */}
        <Section title="Idioma" defaultOpen={false}>
          <ul className="space-y-1">
            {LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  type="button"
                  onClick={() => setLanguage(filters.language === lang.code ? null : lang.code)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                    filters.language === lang.code
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lang.label}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </aside>
  )
}
