import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { searchArticles } from '../api/articles'
import { fetchStats, fetchTrending, type SiteStats } from '../api/insights'
import MagazineCover from '../components/articles/MagazineCover'
import AreaIcon from '../components/ui/AreaIcon'
import Dropdown from '../components/ui/Dropdown'
import { useMagazines } from '../hooks/useMagazines'
import { AREAS, inferArea, searchLink } from '../data/areas'
import { buildCitation } from '../lib/citation'
import type { Article, Magazine, SearchFacets, SearchFilters } from '../types'
import iconSearch from '../assets/icons/search.svg'
import iconArrow from '../assets/icons/arrow-right.svg'
import iconDownload from '../assets/icons/download.svg'
import iconQuote from '../assets/icons/quote.svg'
import iconDot from '../assets/icons/dot.svg'

const SUGGESTIONS = [
  'aprendizado de máquina',
  'engenharia de requisitos',
  'redes 5G',
  'ensino de programação',
]

const NO_FILTERS: SearchFilters = {
  magazine_id: null,
  year_from: null,
  year_to: null,
  language: null,
  keyword: null,
  has_doi: null,
}

const NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

function formatYear(dateStr?: string): string {
  if (!dateStr) return ''
  const year = new Date(dateStr).getFullYear()
  return isNaN(year) ? '' : String(year)
}

/** Primeiras frases do resumo, sem marcacao HTML nem quebras de linha. */
function summary(abstract?: string): string {
  const text = (abstract ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text || 'Resumo não disponível.'
}

function SectionTitle({ title, to, linkLabel }: { title: string; to?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <h2 className="text-[28px] sm:text-4xl font-semibold">{title}</h2>
      {to && linkLabel && (
        <Link
          to={to}
          className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-verde-600 hover:text-verde-700"
        >
          {linkLabel}
          <img src={iconArrow} alt="" aria-hidden="true" className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

const iconButtonClass =
  'w-11 h-11 rounded-[10px] bg-white border border-linha inline-flex items-center justify-center ' +
  'hover:border-brand-300 transition-colors'

function CiteButton({ article, magazine }: { article: Article; magazine?: Magazine }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildCitation(article, magazine))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sem permissao de area de transferencia: nada a fazer
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={iconButtonClass}
      aria-label={copied ? 'Citação copiada' : 'Copiar citação'}
      title={copied ? 'Citação copiada' : 'Copiar citação'}
    >
      {copied ? (
        <Check className="w-[18px] h-[18px] text-verde-600" aria-hidden="true" />
      ) : (
        <img src={iconQuote} alt="" aria-hidden="true" className="w-[18px] h-[18px]" />
      )}
    </button>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { magazines } = useMagazines()
  const [query, setQuery] = useState('')
  const [areaSlug, setAreaSlug] = useState('')
  const [recent, setRecent] = useState<Article[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [facets, setFacets] = useState<SearchFacets | undefined>()
  const [areaCounts, setAreaCounts] = useState<Record<string, number>>({})
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null)
  const [trending, setTrending] = useState<string[]>(SUGGESTIONS)

  useEffect(() => {
    let active = true
    searchArticles({ query: '', searchType: 'simple', filters: NO_FILTERS, page: 1, limit: 3 })
      .then((res) => {
        if (!active) return
        setRecent(res.articles)
        setTotal(res.total)
        setFacets(res.facets)
      })
      .catch(() => {
        // Sem API a pagina continua utilizavel: os numeros ficam como "—"
      })

    fetchStats()
      .then((st) => active && setSiteStats(st))
      .catch(() => null)
    // Buscas mais feitas por usuarios diferentes; sem dados suficientes o servidor devolve temas de exemplo
    fetchTrending(4)
      .then((items) => active && items.length > 0 && setTrending(items.map((i) => i.query)))
      .catch(() => null)

    // Cada area e uma busca por termo; so o total interessa
    Promise.all(
      AREAS.map((area) =>
        searchArticles({ query: area.term, searchType: 'simple', filters: NO_FILTERS, page: 1, limit: 1 })
          .then((res) => [area.slug, res.total] as const)
          .catch(() => null),
      ),
    ).then((entries) => {
      if (!active) return
      setAreaCounts(Object.fromEntries(entries.filter((e): e is readonly [string, number] => e !== null)))
    })

    return () => {
      active = false
    }
  }, [])

  const magazineById = useMemo(() => new Map(magazines.map((m) => [m.id, m])), [magazines])
  const countByMagazine = useMemo(
    () => new Map((facets?.by_magazine ?? []).map((f) => [f.id, f.count])),
    [facets],
  )

  // Sem dados da API os blocos continuam na tela, com "—" (fidelidade ao Figma)
  const recentCards: (Article | null)[] = recent.length > 0 ? recent : [null, null, null]
  const magazineCards: (Magazine | null)[] = magazines.length > 0 ? magazines : [null, null, null, null]

  const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '—' : NUMBER_FORMAT.format(n))
  const stats = [
    { value: fmt(siteStats?.articles ?? total), label: 'artigos indexados' },
    { value: fmt(siteStats?.magazines ?? (magazines.length || null)), label: 'revistas brasileiras' },
    { value: fmt(siteStats?.authors), label: 'autores' },
    // Vem da afiliacao informada pelas revistas; "—" enquanto nenhuma informa
    { value: fmt(siteStats?.institutions), label: 'instituições' },
  ]

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const area = AREAS.find((a) => a.slug === areaSlug)
    // A busca por texto usa uma unica frase: com texto digitado ele vale, sem texto vale o termo da area
    navigate(searchLink(query.trim() || area?.term || ''))
  }

  return (
    <main>
      {/* Destaque */}
      <section className="bg-brand-600">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-12 lg:py-0 lg:h-[580px] flex items-center gap-12">
          <div className="flex-1 min-w-0 lg:max-w-[780px] flex flex-col gap-5 lg:gap-6">
            <p className="text-amarelo-400 text-[13px] font-semibold uppercase tracking-[0.12em]">
              Acervo aberto da computação brasileira
            </p>
            <h1 className="!text-creme font-bold text-[36px] sm:text-5xl lg:text-[60px] leading-[1.08] text-balance">
              Toda a pesquisa brasileira em computação, num só lugar.
            </h1>
            <p className="text-tinta-claro text-base sm:text-[19px] leading-[1.55]">
              Encontre artigos e revistas científicas da área reunidos em uma base única, aberta e
              organizada.
            </p>

            <form
              role="search"
              onSubmit={handleSubmit}
              className="bg-white border border-linha rounded-[14px] p-2 pl-5 flex items-center gap-3"
            >
              <img src={iconSearch} alt="" aria-hidden="true" className="w-[22px] h-[22px] shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar artigos"
                placeholder="Título, autor, palavra-chave ou DOI"
                className="flex-1 min-w-0 h-12 bg-transparent text-base sm:text-[17px] text-brand-700
                           placeholder:text-[#6b6b6b] focus:outline-none"
              />
              <div className="hidden sm:flex h-11 items-center border-l border-linha pl-3 pr-1 shrink-0">
                <Dropdown
                  label="Área"
                  value={areaSlug}
                  onChange={setAreaSlug}
                  options={[{ value: '', label: 'Todas as áreas' }, ...AREAS.map((a) => ({ value: a.slug, label: a.label }))]}
                  buttonClassName="text-[15px] text-tinta max-w-[190px] hover:text-brand-600"
                  panelClassName="min-w-[280px]"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-5 sm:px-6 rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white
                           font-semibold text-base transition-colors"
              >
                Buscar
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm text-tinta-claro">Mais buscados:</span>
              {trending.map((term) => (
                <Link
                  key={term}
                  to={searchLink(term)}
                  className="h-[34px] px-3.5 inline-flex items-center rounded-full text-sm text-creme
                             border border-creme/35 hover:bg-creme/10 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex w-[484px] shrink-0 items-center justify-center" aria-hidden="true">
            <img src="/bbcc-logo/svg/animado/bbcc-carregando-claro.svg" alt="" className="w-[380px] h-[380px]" />
          </div>
        </div>
      </section>

      {/* Numeros */}
      <section className="bg-white border-b border-linha" aria-label="A base em números">
        <dl className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 grid grid-cols-2 lg:grid-cols-4 gap-y-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-4 sm:px-8 flex flex-col gap-1.5 ${i % 2 === 1 ? 'border-l border-linha' : ''} ${
                i > 0 ? 'lg:border-l lg:border-linha' : ''
              }`}
            >
              <dd className="order-1 font-display font-bold text-[32px] lg:text-[44px] text-brand-600 leading-tight tabular-nums">
                {stat.value}
              </dd>
              <dt className="order-2 text-[15px]">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pb-14 lg:pb-20">
        {/* Artigos recentes */}
        <section className="pt-14 lg:pt-20 flex flex-col gap-8" aria-labelledby="recentes">
          <div id="recentes">
            <SectionTitle title="Artigos recentes" to="/artigos" linkLabel="Ver todos os artigos" />
          </div>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentCards.map((article, idx) => {
              const magazine = article ? magazineById.get(article.magazine_id) : undefined
              const year = formatYear(article?.publication_date)
              const authors = article?.authors ?? []
              const fullText = article?.url || article?.doi
              const theme = article ? (inferArea(article)?.label ?? article.keywords?.[0]) : undefined
              const excerpt = summary(article?.abstract)
              return (
                <li key={article?.id ?? `vazio-${idx}`} className="bg-white border border-linha rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <MagazineCover magazine={magazine} />
                    <div className="min-w-0 flex flex-col gap-2.5">
                      <div className="flex flex-wrap gap-2">
                        <span className="h-[26px] px-2.5 inline-flex items-center rounded-full bg-verde-50 text-verde-600 text-xs font-semibold max-w-full truncate">
                          {theme ?? '—'}
                        </span>
                        {article?.open_access && (
                          <span className="h-[26px] px-2.5 inline-flex items-center rounded-full bg-amarelo-100 text-[#8a6a00] text-xs font-semibold">
                            Acesso aberto
                          </span>
                        )}
                      </div>
                      <h3 className="text-[19px] font-semibold leading-[1.3] line-clamp-4 break-anywhere">
                        {article?.title ?? '—'}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-3 break-anywhere">{excerpt}</p>
                  <div className="text-[13px] flex flex-col gap-1">
                    <p className="font-medium text-brand-600 line-clamp-2 break-anywhere">
                      {authors.length > 0
                        ? authors.length > 3
                          ? `${authors.slice(0, 3).join('; ')} e mais ${authors.length - 3}`
                          : authors.join('; ')
                        : '—'}
                    </p>
                    <p>{magazine?.description ?? magazine?.name ?? '—'} · {year || '—'}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-linha flex items-center justify-between gap-3">
                    {article ? (
                      <Link
                        to={`/article/${article.id}`}
                        className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-verde-600 hover:text-verde-700"
                      >
                        Ler artigo
                        <img src={iconArrow} alt="" aria-hidden="true" className="w-4 h-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-verde-600">
                        Ler artigo
                        <img src={iconArrow} alt="" aria-hidden="true" className="w-4 h-4" />
                      </span>
                    )}
                    <div className="flex gap-2">
                      {fullText ? (
                        <a
                          href={fullText}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={iconButtonClass}
                          aria-label="Abrir o texto completo na revista"
                          title="Abrir o texto completo na revista"
                        >
                          <img src={iconDownload} alt="" aria-hidden="true" className="w-[18px] h-[18px]" />
                        </a>
                      ) : (
                        <span className={`${iconButtonClass} opacity-50`} aria-hidden="true">
                          <img src={iconDownload} alt="" className="w-[18px] h-[18px]" />
                        </span>
                      )}
                      {article ? (
                        <CiteButton article={article} magazine={magazine} />
                      ) : (
                        <span className={`${iconButtonClass} opacity-50`} aria-hidden="true">
                          <img src={iconQuote} alt="" className="w-[18px] h-[18px]" />
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Revistas indexadas */}
        <section className="pt-14 lg:pt-20 flex flex-col gap-8" aria-labelledby="revistas">
          <div id="revistas">
            <SectionTitle title="Revistas indexadas" to="/revistas" linkLabel="Ver todas as revistas" />
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {magazineCards.map((magazine, i) => {
              const count = magazine ? countByMagazine.get(magazine.id) : undefined
              const inner = (
                <>
                  <MagazineCover magazine={magazine ?? undefined} />
                  <span className="min-w-0 flex flex-col gap-2">
                    <span className="text-[16px] font-semibold leading-[1.3] text-brand-600 break-anywhere">
                      {magazine ? (magazine.description ?? magazine.name) : '—'}
                    </span>
                    <span className="text-[13px] mt-auto tabular-nums">
                      {count !== undefined ? NUMBER_FORMAT.format(count) : '—'} {count === 1 ? 'artigo' : 'artigos'}
                    </span>
                  </span>
                </>
              )
              const box =
                'h-full bg-white border border-linha rounded-2xl p-5 flex gap-4 hover:border-brand-300 hover:shadow-card-hover transition-all'
              return (
                <li key={magazine?.id ?? `vazio-${i}`}>
                  {magazine ? (
                    <Link to={`/artigos?magazine=${magazine.id}`} className={box}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={box}>{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* Explore por area */}
        <section className="pt-14 lg:pt-20 flex flex-col gap-8" aria-labelledby="areas">
          <div id="areas">
            <SectionTitle title="Explore por área" to="/areas" linkLabel="Ver todas as áreas" />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AREAS.map((area) => {
              const count = areaCounts[area.slug]
              return (
                <li key={area.slug}>
                  <Link
                    to={searchLink(area.term)}
                    className="group h-full flex flex-col bg-white border border-linha rounded-2xl p-5
                               hover:border-brand-600 hover:shadow-card-hover transition-all"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span
                        className="w-[72px] h-[72px] rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center
                                   group-hover:bg-brand-600 group-hover:text-creme transition-colors"
                      >
                        <AreaIcon slug={area.slug} className="w-12 h-12" />
                      </span>
                      <span className="text-right">
                        <span className="block font-display font-bold text-[40px] leading-none text-brand-600 tabular-nums">
                          {count !== undefined ? NUMBER_FORMAT.format(count) : '—'}
                        </span>
                        <span className="block mt-1 text-xs">{count === 1 ? 'artigo' : 'artigos'}</span>
                      </span>
                    </span>
                    <span className="mt-5 font-semibold text-[17px] text-brand-600 leading-snug">{area.label}</span>
                    <span className="mt-auto pt-4 flex items-center justify-between text-[13px] font-semibold text-verde-600">
                      Explorar a área
                      <img
                        src={iconArrow}
                        alt=""
                        aria-hidden="true"
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Chamada para editores */}
        <section className="pt-14 lg:pt-20" aria-labelledby="editores">
          <div className="bg-white border border-linha rounded-[20px] px-6 py-8 sm:px-14 sm:py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-[720px] flex flex-col gap-3">
              <p className="flex items-center gap-2 text-verde-600 text-[13px] font-semibold uppercase tracking-[0.1em]">
                <img src={iconDot} alt="" aria-hidden="true" className="w-2.5 h-2.5" />
                Para editores
              </p>
              <h2 id="editores" className="text-[26px] sm:text-[34px] font-semibold leading-tight">
                Sua revista publica em computação?
              </h2>
              <p className="text-base sm:text-[17px] leading-[1.6]">
                Indique a revista para que seus artigos façam parte da base e alcancem mais pesquisadores.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 shrink-0">
              <Link
                to="/sobre#indicar"
                className="h-[52px] px-7 inline-flex items-center rounded-xl bg-brand-600 text-creme font-semibold
                           text-base hover:bg-brand-700 transition-colors"
              >
                Indicar revista
              </Link>
              <Link to="/sobre#criterios" className="font-semibold text-base text-brand-600 hover:text-brand-700">
                Critérios de indexação
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
