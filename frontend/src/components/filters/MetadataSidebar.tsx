import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { Magazine, SearchFilters, MagazineFacet, YearFacet, LanguageFacet, KeywordFacet, DoiFacet } from '../../types'

interface MetadataSidebarProps {
  magazines: Magazine[]
  filters: SearchFilters
  onFilterChange: (filters: SearchFilters) => void
  magazineFacets?: MagazineFacet[]
  yearFacets?: YearFacet[]
  languageFacets?: LanguageFacet[]
  keywordFacets?: KeywordFacet[]
  doiFacets?: DoiFacet[]
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

const LANGUAGE_LABELS: Record<string, string> = {
  'pt': 'Português',
  'pt-br': 'Português',
  'en': 'English',
  'en-us': 'English',
  'es': 'Español',
  'es-es': 'Español',
  'fr': 'Français',
}

const FALLBACK_LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

function FacetButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
        active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span className="ml-1 shrink-0 text-xs text-slate-400 tabular-nums">{count}</span>
      )}
    </button>
  )
}

export default function MetadataSidebar({
  magazines,
  filters,
  onFilterChange,
  magazineFacets = [],
  yearFacets = [],
  languageFacets,
  keywordFacets,
  doiFacets,
}: MetadataSidebarProps) {
  const hasActiveFilters =
    filters.magazine_id !== null ||
    filters.year_from !== null ||
    filters.year_to !== null ||
    filters.language !== null ||
    filters.keyword !== null ||
    filters.has_doi !== null

  const magMap = Object.fromEntries(magazines.map((m) => [m.id, m.name]))
  const countByMag: Record<number, number> = {}
  magazineFacets.forEach((f) => { countByMag[f.id] = f.count })

  const years = yearFacets.map((f) => parseInt(f.year)).filter((y) => !isNaN(y)).sort()
  const minYear = years[0] ?? 2000
  const maxYear = years[years.length - 1] ?? new Date().getFullYear()

  const displayedMagazines = magazineFacets.length > 0
    ? magazines.filter((m) => countByMag[m.id] !== undefined)
    : magazines

  function clearFilters() {
    onFilterChange({ magazine_id: null, year_from: null, year_to: null, language: null, keyword: null, has_doi: null })
  }

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

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-slate-100">
            {filters.magazine_id && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                {magMap[filters.magazine_id] ?? `Revista ${filters.magazine_id}`}
                <button onClick={() => onFilterChange({ ...filters, magazine_id: null })}><X className="w-3 h-3" /></button>
              </span>
            )}
            {(filters.year_from || filters.year_to) && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                {filters.year_from ?? '—'} – {filters.year_to ?? '—'}
                <button onClick={() => onFilterChange({ ...filters, year_from: null, year_to: null })}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.language && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                {LANGUAGE_LABELS[filters.language.toLowerCase()] ?? filters.language}
                <button onClick={() => onFilterChange({ ...filters, language: null })}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.keyword && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                {filters.keyword}
                <button onClick={() => onFilterChange({ ...filters, keyword: null })}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.has_doi !== null && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                {filters.has_doi ? 'Com DOI' : 'Sem DOI'}
                <button onClick={() => onFilterChange({ ...filters, has_doi: null })}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Revista */}
        <Section title="Revista" defaultOpen>
          <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
            <li>
              <FacetButton
                active={filters.magazine_id === null}
                onClick={() => onFilterChange({ ...filters, magazine_id: null })}
                label="Todas as revistas"
              />
            </li>
            {displayedMagazines.map((m) => (
              <li key={m.id}>
                <FacetButton
                  active={filters.magazine_id === m.id}
                  onClick={() => onFilterChange({ ...filters, magazine_id: filters.magazine_id === m.id ? null : m.id })}
                  label={m.name}
                  count={countByMag[m.id]}
                />
              </li>
            ))}
          </ul>
        </Section>

        {/* Idioma */}
        <Section title="Idioma" defaultOpen>
          <ul className="space-y-1">
            {languageFacets && languageFacets.length > 0 ? (
              languageFacets.map((lf) => (
                <li key={lf.code}>
                  <FacetButton
                    active={filters.language === lf.code}
                    onClick={() => onFilterChange({ ...filters, language: filters.language === lf.code ? null : lf.code })}
                    label={LANGUAGE_LABELS[lf.code.toLowerCase()] ?? lf.code}
                    count={lf.count}
                  />
                </li>
              ))
            ) : (
              FALLBACK_LANGUAGES.map((lang) => (
                <li key={lang.code}>
                  <FacetButton
                    active={filters.language === lang.code}
                    onClick={() => onFilterChange({ ...filters, language: filters.language === lang.code ? null : lang.code })}
                    label={lang.label}
                  />
                </li>
              ))
            )}
          </ul>
        </Section>

        {/* Ano de publicação */}
        <Section title="Ano de publicação" defaultOpen>
          {yearFacets.length > 0 && (
            <p className="text-xs text-slate-400 mb-2">{minYear} – {maxYear}</p>
          )}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              min={1990}
              max={maxYear}
              placeholder="De"
              value={filters.year_from ?? ''}
              onChange={(e) => onFilterChange({ ...filters, year_from: e.target.value ? parseInt(e.target.value) : null })}
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
              onChange={(e) => onFilterChange({ ...filters, year_to: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg
                         focus:outline-none focus:border-blue-500 text-slate-700 transition-colors"
            />
          </div>
          {yearFacets.length > 0 && (
            <ul className="space-y-0.5 max-h-48 overflow-y-auto">
              {[...yearFacets].reverse().map((f) => (
                <li key={f.year}>
                  <FacetButton
                    active={filters.year_from === parseInt(f.year) && filters.year_to === parseInt(f.year)}
                    onClick={() => onFilterChange({
                      ...filters,
                      year_from: parseInt(f.year),
                      year_to: parseInt(f.year),
                    })}
                    label={f.year}
                    count={f.count}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Palavras-chave */}
        {keywordFacets && keywordFacets.length > 0 && (
          <Section title="Palavras-chave" defaultOpen={false}>
            <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {keywordFacets.map((kf) => (
                <li key={kf.keyword}>
                  <FacetButton
                    active={filters.keyword === kf.keyword}
                    onClick={() => onFilterChange({ ...filters, keyword: filters.keyword === kf.keyword ? null : kf.keyword })}
                    label={kf.keyword}
                    count={kf.count}
                  />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Acesso */}
        {doiFacets && doiFacets.some((d) => d.count > 0) && (
          <Section title="Acesso" defaultOpen={false}>
            <ul className="space-y-1">
              {doiFacets.map((df) => (
                <li key={df.value}>
                  <FacetButton
                    active={filters.has_doi === (df.value === 'com_doi')}
                    onClick={() => {
                      const next = df.value === 'com_doi'
                      onFilterChange({ ...filters, has_doi: filters.has_doi === next ? null : next })
                    }}
                    label={df.label}
                    count={df.count}
                  />
                </li>
              ))}
            </ul>
          </Section>
        )}

      </div>
    </aside>
  )
}
