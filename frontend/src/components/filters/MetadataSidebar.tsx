import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import type {
  Magazine,
  SearchFilters,
  MagazineFacet,
  YearFacet,
  LanguageFacet,
  KeywordFacet,
  DoiFacet,
} from '../../types'

interface MetadataSidebarProps {
  magazines: Magazine[]
  filters: SearchFilters
  onFilterChange: (filters: SearchFilters) => void
  magazineFacets?: MagazineFacet[]
  yearFacets?: YearFacet[]
  languageFacets?: LanguageFacet[]
  keywordFacets?: KeywordFacet[]
  doiFacets?: DoiFacet[]
  /** Botao de fechar, usado quando o painel aparece como gaveta no celular */
  onClose?: () => void
}

export const EMPTY_FILTERS: SearchFilters = {
  magazine_id: null,
  year_from: null,
  year_to: null,
  language: null,
  keyword: null,
  has_doi: null,
}

// Os periodicos usam ora codigo de 2 letras (pt), ora de 3 (por): cobrimos os dois
export const LANGUAGE_LABELS: Record<string, string> = {
  pt: 'Português',
  'pt-br': 'Português',
  por: 'Português',
  en: 'English',
  'en-us': 'English',
  eng: 'English',
  es: 'Español',
  'es-es': 'Español',
  spa: 'Español',
  fr: 'Français',
  fra: 'Français',
  fre: 'Français',
}

const FALLBACK_LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

export function countActiveFilters(filters: SearchFilters): number {
  let n = 0
  if (filters.magazine_id !== null) n++
  if (filters.year_from !== null || filters.year_to !== null) n++
  if (filters.language !== null) n++
  if (filters.keyword !== null) n++
  if (filters.has_doi !== null) n++
  return n
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-3 px-4 text-sm font-semibold
                   text-slate-700 hover:text-slate-900 transition-colors"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

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
      aria-pressed={active}
      className={`w-full text-left text-sm px-2 py-2 sm:py-1.5 rounded-lg transition-colors
                  flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-brand-50 text-brand-800 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span className="shrink-0 text-xs text-slate-400 tabular-nums">{count}</span>
      )}
    </button>
  )
}

/** Etiquetas dos filtros aplicados, exibidas acima da lista de resultados */
export function FilterChips({
  filters,
  magazines,
  onFilterChange,
}: {
  filters: SearchFilters
  magazines: Magazine[]
  onFilterChange: (filters: SearchFilters) => void
}) {
  const magMap = Object.fromEntries(magazines.map((m) => [m.id, m.name]))

  const chips: { key: string; label: string; clear: Partial<SearchFilters> }[] = []
  if (filters.magazine_id !== null) {
    chips.push({
      key: 'magazine',
      label: magMap[filters.magazine_id] ?? `Revista ${filters.magazine_id}`,
      clear: { magazine_id: null },
    })
  }
  if (filters.year_from !== null || filters.year_to !== null) {
    const from = filters.year_from ?? '…'
    const to = filters.year_to ?? '…'
    chips.push({
      key: 'year',
      label: from === to ? `${from}` : `${from} – ${to}`,
      clear: { year_from: null, year_to: null },
    })
  }
  if (filters.language !== null) {
    chips.push({
      key: 'language',
      label: LANGUAGE_LABELS[filters.language.toLowerCase()] ?? filters.language,
      clear: { language: null },
    })
  }
  if (filters.keyword !== null) {
    chips.push({ key: 'keyword', label: filters.keyword, clear: { keyword: null } })
  }
  if (filters.has_doi !== null) {
    chips.push({
      key: 'doi',
      label: filters.has_doi ? 'Com DOI' : 'Sem DOI',
      clear: { has_doi: null },
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 text-xs bg-brand-50 text-brand-800
                     border border-brand-100 rounded-full pl-2.5 pr-1.5 py-1 max-w-[14rem]"
        >
          <span className="truncate">{chip.label}</span>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, ...chip.clear })}
            aria-label={`Remover filtro ${chip.label}`}
            className="text-brand-500 hover:text-brand-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onFilterChange({ ...EMPTY_FILTERS })}
        className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors"
      >
        Limpar tudo
      </button>
    </div>
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
  onClose,
}: MetadataSidebarProps) {
  const activeCount = countActiveFilters(filters)

  const countByMag: Record<number, number> = {}
  magazineFacets.forEach((f) => {
    countByMag[f.id] = f.count
  })

  const years = yearFacets.map((f) => parseInt(f.year)).filter((y) => !isNaN(y)).sort()
  const minYear = years[0] ?? 2000
  const maxYear = years[years.length - 1] ?? new Date().getFullYear()

  const displayedMagazines =
    magazineFacets.length > 0
      ? magazines.filter((m) => countByMag[m.id] !== undefined)
      : magazines

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-700">Refinar busca</span>
          {activeCount > 0 && (
            <span className="text-xs font-semibold text-white bg-brand-600 rounded-full px-1.5 py-0.5 tabular-nums">
              {activeCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...EMPTY_FILTERS })}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              Limpar
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar filtros"
              className="text-slate-400 hover:text-slate-700 transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <Section title="Revista">
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
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    magazine_id: filters.magazine_id === m.id ? null : m.id,
                  })
                }
                label={m.name}
                count={countByMag[m.id]}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Idioma">
        <ul className="space-y-1">
          {languageFacets && languageFacets.length > 0
            ? languageFacets.map((lf) => (
                <li key={lf.code}>
                  <FacetButton
                    active={filters.language === lf.code}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        language: filters.language === lf.code ? null : lf.code,
                      })
                    }
                    label={LANGUAGE_LABELS[lf.code.toLowerCase()] ?? lf.code}
                    count={lf.count}
                  />
                </li>
              ))
            : FALLBACK_LANGUAGES.map((lang) => (
                <li key={lang.code}>
                  <FacetButton
                    active={filters.language === lang.code}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        language: filters.language === lang.code ? null : lang.code,
                      })
                    }
                    label={lang.label}
                  />
                </li>
              ))}
        </ul>
      </Section>

      <Section title="Ano de publicação">
        {yearFacets.length > 0 && (
          <p className="text-xs text-slate-400 mb-2 tabular-nums">
            Resultados entre {minYear} e {maxYear}
          </p>
        )}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            inputMode="numeric"
            min={1990}
            max={maxYear}
            placeholder="De"
            aria-label="Ano inicial"
            value={filters.year_from ?? ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                year_from: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700
                       focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
          />
          <span className="text-slate-400 text-xs shrink-0">até</span>
          <input
            type="number"
            inputMode="numeric"
            min={1990}
            max={maxYear}
            placeholder="Até"
            aria-label="Ano final"
            value={filters.year_to ?? ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                year_to: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700
                       focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
          />
        </div>
        {yearFacets.length > 0 && (
          <ul className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
            {[...yearFacets].reverse().map((f) => (
              <li key={f.year}>
                <FacetButton
                  active={
                    filters.year_from === parseInt(f.year) && filters.year_to === parseInt(f.year)
                  }
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      year_from: parseInt(f.year),
                      year_to: parseInt(f.year),
                    })
                  }
                  label={f.year}
                  count={f.count}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {keywordFacets && keywordFacets.length > 0 && (
        <Section title="Palavras-chave" defaultOpen={false}>
          <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {keywordFacets.map((kf) => (
              <li key={kf.keyword}>
                <FacetButton
                  active={filters.keyword === kf.keyword}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      keyword: filters.keyword === kf.keyword ? null : kf.keyword,
                    })
                  }
                  label={kf.keyword}
                  count={kf.count}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

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
  )
}
