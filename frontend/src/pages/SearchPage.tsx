import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, Download, Info, LayoutList, Table2, Search } from 'lucide-react'
import MagazineCover from '../components/articles/MagazineCover'
import { useSearch } from '../hooks/useSearch'
import { useMagazines } from '../hooks/useMagazines'
import { AREAS, inferArea } from '../data/areas'
import { addHistory } from '../api/account'
import { useAuth } from '../context/AuthContext'
import { downloadCsv } from '../lib/csv'
import type { Article, Magazine, SearchFacets, SearchFilters } from '../types'

const NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')
const PAGE_SIZES = [10, 20, 50]

// Tipos de publicacao do Figma. O backend ainda nao classifica por tipo, autor ou area.
const TYPES = [
  { label: 'Artigo', color: '#16325c' },
  { label: 'Artigo de conferência', color: '#1e7f57' },
  { label: 'Dissertação', color: '#e8b931' },
  { label: 'Capítulo de livro', color: '#7d8fb8' },
  { label: 'Tese', color: '#86d3b7' },
]

const BOOLEAN_HELP = [
  'AND — ambos os termos: redes neurais AND aprendizado',
  'OR — qualquer um dos termos: machine learning OR aprendizado de máquina',
  'NOT — excluir termo: inteligência artificial NOT robótica',
  'Aspas — frase exata: "processamento de linguagem natural"',
  'Agrupamento: (redes OR grafos) AND algoritmos',
]

function formatYear(dateStr?: string): string {
  if (!dateStr) return '—'
  const year = new Date(dateStr).getFullYear()
  return isNaN(year) ? '—' : String(year)
}

/** Destaca em verde os termos buscados, ignorando operadores booleanos e aspas. */
function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query
    .replace(/["()]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !/^(AND|OR|NOT)$/.test(t))
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (terms.length === 0) return <>{text}</>
  const parts = text.split(new RegExp(`(${terms.join('|')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-verde-600">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-verde-600' : 'bg-brand-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

function Select({
  value,
  onChange,
  options,
  label,
  className = '',
}: {
  value: string | number
  onChange?: (v: string) => void
  options: { value: string | number; label: string }[]
  label: string
  className?: string
}) {
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="appearance-none h-11 w-full pl-4 pr-9 rounded-[10px] bg-white border border-linha text-[15px]
                   font-semibold text-brand-600 cursor-pointer hover:border-brand-300 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-tinta absolute right-3 pointer-events-none" aria-hidden="true" />
    </span>
  )
}

interface FilterItem {
  key: string
  label: string
  count?: number
  checked?: boolean
  onToggle?: () => void
}

function FilterGroup({ title, items, placeholders }: { title: string; items: FilterItem[]; placeholders: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const rows: FilterItem[] =
    items.length > 0 ? items : placeholders.map((label) => ({ key: label, label }))
  const visible = expanded ? rows : rows.slice(0, 5)

  return (
    <section className="bg-white border border-linha rounded-2xl p-5" aria-label={`Filtrar por ${title.toLowerCase()}`}>
      <h3 className="font-sans text-xs font-bold tracking-[0.1em] uppercase text-brand-600 mb-3">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {visible.map((item) => (
          <li key={item.key}>
            <label
              className={`flex items-start gap-2.5 text-[13px] leading-snug ${
                item.onToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
              title={item.onToggle ? undefined : 'Ainda sem dados no backend'}
            >
              <input
                type="checkbox"
                checked={!!item.checked}
                disabled={!item.onToggle}
                onChange={item.onToggle}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#16325c]"
              />
              <span className="flex-1 min-w-0 break-anywhere">{item.label}</span>
              <span className="text-xs text-tinta tabular-nums">
                {item.count !== undefined ? NUMBER_FORMAT.format(item.count) : '—'}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {rows.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-[13px] font-semibold text-verde-600 hover:text-verde-700"
        >
          {expanded ? 'ver menos' : 'ver mais'}
        </button>
      )}
    </section>
  )
}

function ChartCard({
  title,
  onExport,
  children,
}: {
  title: string
  onExport?: () => void
  children: ReactNode
}) {
  return (
    <section className="bg-white border border-linha rounded-2xl p-5" aria-label={title}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-sans text-sm font-semibold text-brand-600">{title}</h3>
        <button
          type="button"
          onClick={onExport}
          disabled={!onExport}
          className="p-1 text-verde-600 hover:text-verde-700 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Exportar dados: ${title}`}
          title="Exportar CSV"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {children}
    </section>
  )
}

function YearChart({ facets }: { facets?: SearchFacets }) {
  // Ultimos 10 anos com dados, em ordem cronologica
  const years = useMemo(
    () =>
      [...(facets?.by_year ?? [])]
        .filter((y) => /^\d{4}$/.test(y.year))
        .sort((a, b) => Number(a.year) - Number(b.year))
        .slice(-10),
    [facets],
  )
  const max = Math.max(1, ...years.map((y) => y.count))
  const range = years.length > 0 ? `${years[0].year}–${years[years.length - 1].year}` : '—'

  return (
    <>
      <div className="relative h-[130px]" role="img" aria-label={`Publicações por ano de publicação, ${range}`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="absolute inset-x-0 border-t border-linha" style={{ top: `${i * 45}%` }} />
        ))}
        <span className="absolute inset-x-0 bottom-[18px] border-t border-linha" />
        <ul className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between gap-1.5 pb-[18px]">
          {years.length === 0
            ? Array.from({ length: 10 }, (_, i) => <li key={i} className="flex-1 h-[6px] bg-brand-50 rounded-t" />)
            : years.map((y, i) => (
                <li
                  key={y.year}
                  className="flex-1 h-full flex items-end relative"
                  title={`${y.year}: ${NUMBER_FORMAT.format(y.count)} publicações`}
                >
                  <span
                    className="w-full rounded-t-[3px]"
                    style={{
                      height: `${Math.max(3, (y.count / max) * 100)}%`,
                      // Figma: barras alternadas azul/verde; o ano mais recente (parcial) em amarelo
                      background: i === years.length - 1 ? '#e8b931' : i % 2 === 0 ? '#16325c' : '#1e7f57',
                    }}
                  />
                  <span className="absolute -bottom-[18px] inset-x-0 text-center text-[10px] text-tinta tabular-nums">
                    {y.year.slice(2)}
                  </span>
                </li>
              ))}
        </ul>
      </div>
      <p className="mt-3 text-center text-[11px] text-tinta">Ano de publicação ({range})</p>
    </>
  )
}

function TypeDonut() {
  return (
    <div className="flex items-center gap-5">
      <div
        className="w-[110px] h-[110px] rounded-full shrink-0 flex items-center justify-center bg-brand-50"
        role="img"
        aria-label="Publicações por tipo: sem dados ainda"
      >
        <span className="w-[62px] h-[62px] rounded-full bg-white" />
      </div>
      <ul className="flex flex-col gap-1.5 text-xs">
        {TYPES.map((t) => (
          <li key={t.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
            {t.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function MagazineBars({ facets, magazines }: { facets?: SearchFacets; magazines: Magazine[] }) {
  const rows = useMemo(() => {
    const byId = new Map(magazines.map((m) => [m.id, m]))
    return [...(facets?.by_magazine ?? [])]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((f) => ({ name: byId.get(f.id)?.name ?? `#${f.id}`, count: f.count }))
  }, [facets, magazines])
  const max = Math.max(1, ...rows.map((r) => r.count))
  const shown = rows.length > 0 ? rows : ['—', '—', '—', '—'].map((name) => ({ name, count: undefined }))

  return (
    <ul className="flex flex-col gap-3.5">
      {shown.map((row, i) => (
        <li key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-brand-600">{row.name}</span>
            <span className="tabular-nums">{row.count !== undefined ? NUMBER_FORMAT.format(row.count) : '—'}</span>
          </div>
          <div className="h-2 rounded-full bg-brand-50 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: row.count !== undefined ? `${(row.count / max) * 100}%` : '0%',
                background: i % 2 === 0 ? '#16325c' : '#1e7f57',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const { magazines } = useMagazines()
  const { user } = useAuth()
  const {
    articles, total, facets, loading, error,
    page, totalPages, itemsPerPage,
    query, searchType, filters,
    search, setPage, setFilters, setSearchType, setLimit,
  } = useSearch()

  const [text, setText] = useState('')
  const [showFilters, setShowFilters] = useState(() => window.innerWidth >= 1024)
  const [showPanel, setShowPanel] = useState(() => window.innerWidth >= 1280)
  const [view, setView] = useState<'list' | 'table'>('list')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Busca ainda sem resultado, aguardando para entrar no historico com o total encontrado
  const pendingRecord = useRef<string | null>(null)
  const sawLoading = useRef(false)

  // Links de outras telas chegam com ?q=termo e/ou ?magazine=id; sem parametros lista tudo
  const urlQuery = searchParams.get('q')
  const urlMagazine = searchParams.get('magazine')
  useEffect(() => {
    const magazineId = urlMagazine ? Number(urlMagazine) : null
    const q = urlQuery ?? ''
    setText(q)
    pendingRecord.current = q.trim() || null
    search(q, 'simple', {
      ...filters,
      magazine_id: magazineId !== null && !isNaN(magazineId) ? magazineId : null,
    })
    // so reage a mudanca da URL; filtros e tipo atuais vem do estado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, urlMagazine])

  // Guarda a busca no historico quando os resultados chegam; filtros e paginas nao contam como busca nova
  useEffect(() => {
    if (loading) {
      sawLoading.current = true
      return
    }
    if (!sawLoading.current || !pendingRecord.current) return
    const query = pendingRecord.current
    pendingRecord.current = null
    sawLoading.current = false
    if (user && !error) {
      addHistory({ query, area: inferArea({ title: query })?.label ?? null, result_count: total }).catch(() => null)
    }
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // A selecao vale para a pagina exibida
  useEffect(() => setSelected(new Set()), [articles])

  const magById = useMemo(() => new Map(magazines.map((m) => [m.id, m])), [magazines])
  const offset = (page - 1) * itemsPerPage
  const advanced = searchType === 'boolean'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    pendingRecord.current = text.trim() || null
    search(text.trim(), searchType, filters)
  }

  function patchFilters(patch: Partial<SearchFilters>) {
    setFilters({ ...filters, ...patch })
  }

  function goToPage(p: number) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pageNumbers(): (number | '…')[] {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (page > 3) pages.push('…')
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = articles.length > 0 && selected.size === articles.length

  function exportArticles() {
    const rows = articles.filter((a) => selected.size === 0 || selected.has(a.id))
    downloadCsv('bbcc-publicacoes.csv', [
      ['Título', 'Autores', 'Revista', 'Ano', 'DOI', 'URL'],
      ...rows.map((a) => [
        a.title,
        (a.authors ?? []).join('; '),
        magById.get(a.magazine_id)?.name,
        formatYear(a.publication_date),
        a.doi,
        a.url,
      ]),
    ])
  }

  // ---- Filtros laterais ----
  const magazineItems: FilterItem[] = magazines.map((m) => ({
    key: String(m.id),
    label: m.description ?? m.name,
    count: facets?.by_magazine?.find((f) => f.id === m.id)?.count,
    checked: filters.magazine_id === m.id,
    onToggle: () => patchFilters({ magazine_id: filters.magazine_id === m.id ? null : m.id }),
  }))
  const yearItems: FilterItem[] = [...(facets?.by_year ?? [])]
    .filter((y) => /^\d{4}$/.test(y.year))
    .sort((a, b) => Number(b.year) - Number(a.year))
    .map((y) => {
      const n = Number(y.year)
      const checked = filters.year_from === n && filters.year_to === n
      return {
        key: y.year,
        label: y.year,
        count: y.count,
        checked,
        onToggle: () => patchFilters(checked ? { year_from: null, year_to: null } : { year_from: n, year_to: n }),
      }
    })

  const sidebar = (
    <div className="flex flex-col gap-4">
      <FilterGroup title="Autor" items={[]} placeholders={['[Autor(a)]', '[Autor(a)]', '[Autor(a)]', '[Autor(a)]', '[Autor(a)]']} />
      <FilterGroup title="Tipo" items={[]} placeholders={TYPES.map((t) => t.label)} />
      <FilterGroup title="Revista" items={magazineItems} placeholders={['—', '—', '—', '—']} />
      <FilterGroup title="Área" items={[]} placeholders={AREAS.map((a) => a.label)} />
      <FilterGroup title="Ano" items={yearItems} placeholders={['—', '—', '—', '—', '—']} />
    </div>
  )

  const panel = (
    <div className="flex flex-col gap-4">
      <ChartCard
        title="Publicações por ano"
        onExport={
          facets?.by_year?.length
            ? () => downloadCsv('bbcc-publicacoes-por-ano.csv', [['Ano', 'Publicações'], ...facets.by_year!.map((y) => [y.year, y.count])])
            : undefined
        }
      >
        <YearChart facets={facets} />
      </ChartCard>
      <ChartCard title="Publicações por tipo">
        <TypeDonut />
      </ChartCard>
      <ChartCard
        title="Revistas com mais resultados"
        onExport={
          facets?.by_magazine?.length
            ? () =>
                downloadCsv('bbcc-revistas.csv', [
                  ['Revista', 'Publicações'],
                  ...facets.by_magazine!.map((f) => [magById.get(f.id)?.name ?? f.id, f.count]),
                ])
            : undefined
        }
      >
        <MagazineBars facets={facets} magazines={magazines} />
      </ChartCard>
    </div>
  )

  const checkboxClass = 'w-4 h-4 shrink-0 accent-[#16325c]'

  return (
    <main className="flex-1 bg-creme">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-8 pb-14 lg:pt-12 lg:pb-20">
        <h1 className="text-center text-[34px] lg:text-[44px] font-semibold text-brand-600">Publicações</h1>

        {/* Busca */}
        <div className="mt-8 flex items-center gap-3 text-[15px] text-brand-600">
          <span className="font-medium">Busca avançada</span>
          <Switch
            checked={advanced}
            onChange={(v) => setSearchType(v ? 'boolean' : 'simple')}
            label="Busca avançada (operadores booleanos)"
          />
          <span className="relative group">
            <button type="button" className="text-verde-600 p-1" aria-label="Como usar a busca avançada">
              <Info className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>
            <span
              role="tooltip"
              className="hidden group-hover:block group-focus-within:block absolute z-20 left-0 top-full mt-1 w-[320px]
                         max-w-[80vw] bg-white border border-linha rounded-xl shadow-card-hover p-4 text-[13px] text-tinta"
            >
              <strong className="block text-brand-600 mb-2">Operadores da busca avançada</strong>
              <ul className="flex flex-col gap-1.5">
                {BOOLEAN_HELP.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-3" role="search">
          <div className="flex flex-1 min-w-0 bg-white border border-linha rounded-[10px] overflow-hidden focus-within:border-brand-300">
            <Select
              value="publicacoes"
              label="Tipo de busca"
              options={[{ value: 'publicacoes', label: 'Publicações' }]}
              className="[&>select]:border-0 [&>select]:rounded-none [&>select]:h-12 [&>select]:w-[170px] border-r border-linha"
            />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={advanced ? 'Ex.: "machine learning" AND redes NOT hardware' : 'Título, autor, palavra-chave ou resumo'}
              aria-label="Buscar publicações"
              className="flex-1 min-w-0 h-12 px-4 text-base bg-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-12 px-8 rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white font-semibold text-base
                       inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            Buscar
          </button>
        </form>

        {/* Barra de ferramentas */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-brand-600">
          <label className="flex items-center gap-3 font-medium">
            Filtros
            <Switch checked={showFilters} onChange={setShowFilters} label="Mostrar filtros" />
          </label>

          <div className="flex flex-wrap items-center gap-3 lg:mx-auto">
            <span className="text-[13px] font-semibold text-verde-600">Personalizar exibição</span>
            <div className="inline-flex rounded-[10px] border border-linha bg-white overflow-hidden" role="group" aria-label="Modo de exibição">
              {(
                [
                  ['list', LayoutList, 'Lista'],
                  ['table', Table2, 'Tabela'],
                ] as const
              ).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  aria-pressed={view === mode}
                  aria-label={label}
                  title={label}
                  className={`w-11 h-11 inline-flex items-center justify-center ${
                    view === mode ? 'bg-brand-100 text-brand-600' : 'text-tinta hover:bg-brand-50'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-tinta">
              Exibir
              <Select
                value={itemsPerPage}
                onChange={(v) => setLimit(Number(v))}
                options={PAGE_SIZES.map((n) => ({ value: n, label: String(n) }))}
                label="Resultados por página"
                className="[&>select]:w-[84px]"
              />
            </label>
            <button
              type="button"
              onClick={exportArticles}
              disabled={articles.length === 0}
              className="h-11 px-4 rounded-[10px] bg-white border border-linha inline-flex items-center gap-2
                         font-semibold hover:border-brand-300 transition-colors disabled:opacity-50"
              title={selected.size > 0 ? 'Exportar selecionados (CSV)' : 'Exportar esta página (CSV)'}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Exportar
            </button>
            {/* O backend ordena sempre por data; a ordenacao por relevancia ainda nao existe */}
            <Select
              value="relevancia"
              label="Ordenar por"
              options={[{ value: 'relevancia', label: 'Relevância' }]}
              className="[&>select]:w-[140px]"
            />
          </div>

          <label className="flex items-center gap-3 font-medium lg:ml-0">
            Painel
            <Switch checked={showPanel} onChange={setShowPanel} label="Mostrar painel de gráficos" />
          </label>
        </div>

        {error && (
          <div role="alert" className="mt-5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Corpo */}
        <div
          className={`mt-6 grid gap-6 items-start ${
            showFilters && showPanel
              ? 'xl:grid-cols-[296px_minmax(0,1fr)_338px]'
              : showFilters
                ? 'lg:grid-cols-[296px_minmax(0,1fr)]'
                : showPanel
                  ? 'xl:grid-cols-[minmax(0,1fr)_338px]'
                  : ''
          }`}
        >
          {showFilters && <aside aria-label="Filtros">{sidebar}</aside>}

          <section aria-label="Resultados" className="min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3 text-[13px]">
              <p aria-live="polite">
                {loading ? (
                  <span className="animate-pulse">Buscando…</span>
                ) : total === 0 ? (
                  'Nenhuma publicação encontrada'
                ) : (
                  <>
                    Mostrando {NUMBER_FORMAT.format(offset + 1)} – {NUMBER_FORMAT.format(Math.min(offset + itemsPerPage, total))} de{' '}
                    {NUMBER_FORMAT.format(total)}
                    {query && <> para: {query}</>}
                  </>
                )}
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={allSelected}
                  disabled={articles.length === 0}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(articles.map((a) => a.id)))}
                />
                Selecionar todos
              </label>
            </div>

            <div className="bg-white border border-linha rounded-2xl overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20" aria-busy="true">
                  <img src="/bbcc-logo/svg/animado/bbcc-carregando.svg" alt="" aria-hidden="true" className="w-24 h-24" />
                  <p className="mt-3 text-sm">Buscando publicações…</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <p className="font-semibold text-brand-600">Nenhuma publicação encontrada</p>
                  <p className="text-sm mt-1">Tente outros termos ou remova alguns filtros.</p>
                </div>
              ) : view === 'list' ? (
                <ul className="divide-y divide-linha">
                  {articles.map((article) => (
                    <ResultRow
                      key={article.id}
                      article={article}
                      magazine={magById.get(article.magazine_id)}
                      query={query}
                      checked={selected.has(article.id)}
                      onToggle={() => toggleOne(article.id)}
                    />
                  ))}
                </ul>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-brand-50 text-brand-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="w-10 p-3" />
                        <th className="p-3 font-semibold">Título</th>
                        <th className="p-3 font-semibold">Autores</th>
                        <th className="p-3 font-semibold">Revista</th>
                        <th className="p-3 font-semibold">Ano</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-linha">
                      {articles.map((a) => (
                        <tr key={a.id} className="align-top">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              className={checkboxClass}
                              checked={selected.has(a.id)}
                              onChange={() => toggleOne(a.id)}
                              aria-label={`Selecionar ${a.title}`}
                            />
                          </td>
                          <td className="p-3 min-w-[260px]">
                            <Link to={`/article/${a.id}`} className="font-semibold text-brand-600 hover:text-verde-600">
                              <Highlight text={a.title} query={query} />
                            </Link>
                          </td>
                          <td className="p-3 italic min-w-[180px]">{(a.authors ?? []).join(' · ') || '—'}</td>
                          <td className="p-3">{magById.get(a.magazine_id)?.name ?? '—'}</td>
                          <td className="p-3 tabular-nums">{formatYear(a.publication_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!loading && totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2 flex-wrap" aria-label="Paginação">
                {page > 1 && (
                  <button type="button" onClick={() => goToPage(page - 1)} className={pageButton(false, true)}>
                    Anterior
                  </button>
                )}
                {pageNumbers().map((p, i) =>
                  p === '…' ? (
                    <span key={`e-${i}`} className="px-1 select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      aria-current={page === p ? 'page' : undefined}
                      className={pageButton(page === p)}
                    >
                      {p}
                    </button>
                  ),
                )}
                {page < totalPages && (
                  <button type="button" onClick={() => goToPage(page + 1)} className={pageButton(false, true)}>
                    Próxima
                  </button>
                )}
              </nav>
            )}
          </section>

          {showPanel && <aside aria-label="Painel de gráficos">{panel}</aside>}
        </div>
      </div>
    </main>
  )
}

function pageButton(active: boolean, wide = false) {
  return `h-10 ${wide ? 'px-4' : 'min-w-10 px-3'} rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
    active ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-linha text-brand-600 hover:border-brand-300'
  }`
}

function ResultRow({
  article,
  magazine,
  query,
  checked,
  onToggle,
}: {
  article: Article
  magazine?: Magazine
  query: string
  checked: boolean
  onToggle: () => void
}) {
  const authors = article.authors ?? []
  return (
    <li className="flex gap-4 p-5">
      <MagazineCover magazine={magazine} />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          {/* O backend ainda nao informa o tipo: toda publicacao indexada vem de periodico */}
          <span className="h-[22px] px-2.5 inline-flex items-center rounded-full bg-brand-100 text-brand-600 text-[11px] font-semibold">
            Artigo
          </span>
          <span className="text-[13px] font-semibold text-brand-600 tabular-nums">{formatYear(article.publication_date)}</span>
        </div>
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            aria-label={`Selecionar ${article.title}`}
            className="mt-1.5 w-4 h-4 shrink-0 accent-[#16325c]"
          />
          <h2 className="text-[19px] sm:text-[21px] font-semibold leading-[1.3] text-brand-600 break-anywhere">
            <Link to={`/article/${article.id}`} className="hover:text-brand-700">
              <Highlight text={article.title} query={query} />
            </Link>
          </h2>
        </div>
        <p className="text-[13px] italic line-clamp-2 break-anywhere">{authors.length > 0 ? authors.join(' · ') : '—'}</p>
        <p className="text-[13px]">{magazine?.description ?? magazine?.name ?? '—'}</p>
      </div>
    </li>
  )
}
