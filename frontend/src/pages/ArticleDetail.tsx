import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Bookmark, BookmarkCheck, Check, Copy, Download, Quote, Share2 } from 'lucide-react'
import { fetchArticleById, searchArticles } from '../api/articles'
import { fetchMagazineById } from '../api/magazines'
import { useMagazines } from '../hooks/useMagazines'
import { useAuth } from '../context/AuthContext'
import { inferArea } from '../data/areas'
import { buildReference, doiText, doiUrl, type CitationFormat } from '../lib/citation'
import type { Article, Magazine, SearchFilters } from '../types'

const NO_FILTERS: SearchFilters = {
  magazine_id: null,
  year_from: null,
  year_to: null,
  language: null,
  keyword: null,
  has_doi: null,
}

const FORMATS: { id: CitationFormat; label: string }[] = [
  { id: 'abnt', label: 'ABNT' },
  { id: 'apa', label: 'APA' },
  { id: 'bibtex', label: 'BibTeX' },
]

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatYear(dateStr?: string): string {
  if (!dateStr) return '—'
  const year = new Date(dateStr).getFullYear()
  return isNaN(year) ? '—' : String(year)
}

const outlineButton =
  'h-10 px-4 rounded-[10px] bg-white border border-linha inline-flex items-center gap-2 text-sm font-semibold ' +
  'text-brand-600 hover:border-brand-300 transition-colors'

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, savedIds, toggleSaved } = useAuth()
  const { magazines } = useMagazines()
  const [article, setArticle] = useState<Article | null>(null)
  const [magazine, setMagazine] = useState<Magazine | null>(null)
  const [related, setRelated] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [format, setFormat] = useState<CitationFormat>('abnt')
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setError(null)
    setMagazine(null)
    setRelated([])
    window.scrollTo({ top: 0 })

    fetchArticleById(parseInt(id))
      .then((art) => {
        if (!active) return
        setArticle(art)
        if (art.magazine_id) {
          fetchMagazineById(art.magazine_id)
            .then((m) => active && setMagazine(m))
            .catch(() => null)
        }
        // Relacionados: busca pela primeira palavra-chave, sem repetir o proprio artigo
        searchArticles({
          query: art.keywords?.[0] ?? '',
          searchType: 'simple',
          filters: NO_FILTERS,
          page: 1,
          limit: 4,
        })
          .then((res) => active && setRelated(res.articles.filter((a) => a.id !== art.id).slice(0, 3)))
          .catch(() => null)
      })
      .catch(() => active && setError('Artigo não encontrado ou erro ao carregar.'))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [id])

  const magazineById = useMemo(() => new Map(magazines.map((m) => [m.id, m])), [magazines])
  const reference = useMemo(
    () => (article ? buildReference(format, article, magazine ?? undefined) : ''),
    [article, magazine, format],
  )

  if (loading) {
    return (
      <main className="flex-1 bg-creme flex items-center justify-center py-24" aria-busy="true">
        <img src="/bbcc-logo/svg/animado/bbcc-carregando.svg" alt="Carregando…" className="w-24 h-24" />
      </main>
    )
  }

  if (error || !article) {
    return (
      <main className="flex-1 bg-creme flex flex-col items-center justify-center gap-4 px-4 py-24">
        <p className="text-lg">{error ?? 'Artigo não encontrado'}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </main>
    )
  }

  const area = inferArea(article)
  const authors = article.authors ?? []
  const keywords = article.keywords ?? []
  const fullText = article.url || doiUrl(article.doi)

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sem permissao de area de transferencia: nada a fazer
    }
  }

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: article!.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      // Compartilhamento cancelado
    }
  }

  const saved = savedIds.has(article.id)

  // Salvar exige conta: quem nao entrou vai para Entrar e volta para este artigo
  async function toggleSave() {
    if (!user) {
      navigate('/entrar', { state: { from: pathname } })
      return
    }
    try {
      await toggleSaved(article!.id)
    } catch {
      // Falha de rede: o botao simplesmente nao muda de estado
    }
  }

  const meta = [
    { label: 'Revista', value: magazine?.name ?? '—' },
    { label: 'Volume / Número', value: '—' },
    { label: 'Publicado em', value: formatDate(article.publication_date) },
    { label: 'DOI', value: doiText(article.doi) ?? '—', href: doiUrl(article.doi) },
  ]

  return (
    <main className="flex-1 bg-creme">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-6 pb-14 lg:pb-20">
        <nav aria-label="Você está em" className="text-xs flex flex-wrap items-center gap-2 mb-6">
          <Link to="/" className="text-verde-600 font-medium hover:text-verde-700">Início</Link>
          <span aria-hidden="true">/</span>
          <Link to="/artigos" className="text-verde-600 font-medium hover:text-verde-700">Artigos</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{area?.label ?? '—'}</span>
        </nav>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-10 lg:gap-14 items-start">
          {/* Conteudo */}
          <article className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="h-[26px] px-2.5 inline-flex items-center rounded-full bg-verde-50 text-verde-600 text-xs font-semibold">
                {area?.label ?? '—'}
              </span>
              <span className="h-[26px] px-2.5 inline-flex items-center rounded-full bg-amarelo-100 text-[#8a6a00] text-xs font-semibold">
                Acesso aberto
              </span>
            </div>

            <h1 className="mt-4 text-[30px] sm:text-[40px] lg:text-[46px] font-semibold leading-[1.15] text-brand-600 break-anywhere">
              {article.title}
            </h1>

            <p className="mt-5 text-base text-brand-600 break-anywhere">
              {authors.length > 0 ? (
                authors.map((a, i) => (
                  <span key={`${a}-${i}`}>
                    {a}
                    <sup className="text-[10px]">{i + 1}</sup>
                    {i < authors.length - 1 ? ', ' : ''}
                  </span>
                ))
              ) : (
                '—'
              )}
            </p>
            {/* O backend ainda nao guarda a afiliacao dos autores */}
            <p className="mt-1.5 text-xs">
              {(authors.length > 0 ? authors : ['—']).map((_, i, list) => (
                <span key={i}>
                  <sup>{i + 1}</sup> —{i < list.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>

            <dl className="mt-6 grid grid-cols-2 lg:grid-cols-4 bg-white border border-linha rounded-[14px] overflow-hidden">
              {meta.map((item, i) => (
                <div
                  key={item.label}
                  className={`px-5 py-4 flex flex-col gap-1.5 min-w-0 ${i > 0 ? 'lg:border-l lg:border-linha' : ''} ${
                    i % 2 === 1 ? 'border-l border-linha lg:border-l' : ''
                  } ${i >= 2 ? 'border-t border-linha lg:border-t-0' : ''}`}
                >
                  <dt className="text-[11px] font-semibold tracking-[0.1em] uppercase">{item.label}</dt>
                  <dd className="text-sm font-semibold text-brand-600 break-anywhere">
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-verde-600">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Acoes */}
            <div className="mt-5 flex flex-wrap gap-3">
              {fullText ? (
                <a
                  href={fullText}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-6 rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white font-semibold text-[15px]
                             inline-flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Baixar PDF
                </a>
              ) : (
                <span className="h-11 px-6 rounded-[10px] bg-verde-600 text-white font-semibold text-[15px] inline-flex items-center gap-2 opacity-50">
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Baixar PDF
                </span>
              )}
              <button type="button" className={outlineButton} onClick={() => document.getElementById('como-citar')?.scrollIntoView({ behavior: 'smooth' })}>
                <Quote className="w-4 h-4" aria-hidden="true" />
                Citar
              </button>
              <button type="button" className={outlineButton} onClick={share}>
                {shared ? <Check className="w-4 h-4 text-verde-600" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
                {shared ? 'Link copiado' : 'Compartilhar'}
              </button>
              <button type="button" className={outlineButton} onClick={toggleSave} aria-pressed={saved}>
                {saved ? <BookmarkCheck className="w-4 h-4 text-verde-600" aria-hidden="true" /> : <Bookmark className="w-4 h-4" aria-hidden="true" />}
                {saved ? 'Salvo' : 'Salvar'}
              </button>
            </div>

            <hr className="my-8 border-linha" />

            <section aria-labelledby="resumo">
              <h2 id="resumo" className="text-[22px] font-semibold text-brand-600">Resumo</h2>
              <p className="mt-3 text-base leading-[1.7] whitespace-pre-line break-anywhere">{article.abstract || '—'}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-brand-600">Palavras-chave:</span>
                {keywords.length > 0 ? (
                  keywords.map((kw, i) => (
                    <Link
                      key={`${kw}-${i}`}
                      to={`/artigos?q=${encodeURIComponent(kw)}`}
                      className="h-[26px] px-3 inline-flex items-center rounded-full bg-brand-100 text-brand-600 text-xs font-semibold
                                 hover:bg-brand-200 transition-colors"
                    >
                      {kw}
                    </Link>
                  ))
                ) : (
                  <span className="text-[13px]">—</span>
                )}
              </div>
            </section>

            <hr className="my-8 border-linha" />

            <section aria-labelledby="previa">
              <h2 id="previa" className="text-[22px] font-semibold text-brand-600">Pré-visualização</h2>
              <div className="mt-4 bg-white border border-linha rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
                {/* Miniatura ilustrativa do PDF */}
                <div className="w-[220px] shrink-0 bg-white rounded-md shadow-[0_8px_24px_rgba(22,50,92,0.14)] border border-linha px-5 py-6" aria-hidden="true">
                  <div className="h-2.5 w-4/5 rounded bg-brand-500/80 mb-1.5" />
                  <div className="h-2.5 w-3/5 rounded bg-brand-500/80 mb-4" />
                  {[100, 92, 100, 88, 100, 95, 70, 100, 90, 100, 85, 60].map((w, i) => (
                    <div key={i} className="h-1.5 rounded bg-brand-50 mb-2" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="flex flex-col gap-3 text-[15px]">
                  {/* O backend ainda nao informa o numero de paginas */}
                  <p>PDF · — páginas</p>
                  {fullText ? (
                    <>
                      <a href={fullText} target="_blank" rel="noopener noreferrer" className="font-semibold text-verde-600 hover:text-verde-700">
                        Abrir leitor em tela cheia
                      </a>
                      <a href={fullText} target="_blank" rel="noopener noreferrer" className="font-semibold text-verde-600 hover:text-verde-700">
                        Ver na página da revista
                      </a>
                    </>
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>
            </section>
          </article>

          {/* Lateral */}
          <aside className="flex flex-col gap-5" aria-label="Informações da publicação">
            <section className="bg-brand-600 text-white rounded-2xl p-6 flex items-center gap-4">
              <span className="w-14 h-14 rounded-xl bg-creme text-brand-600 inline-flex items-center justify-center font-display font-bold text-sm shrink-0 px-1 text-center leading-tight">
                {magazine?.name ?? '—'}
              </span>
              <div className="min-w-0 flex flex-col gap-1">
                <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-amarelo-400">Publicado em</p>
                <p className="font-semibold text-[15px] leading-snug break-anywhere">
                  {magazine ? (magazine.description ?? magazine.name) : '—'}
                </p>
                {magazine && (
                  <Link to={`/artigos?magazine=${magazine.id}`} className="text-xs text-tinta-claro hover:text-white underline-offset-2 hover:underline">
                    Ver revista
                  </Link>
                )}
              </div>
            </section>

            <section id="como-citar" className="bg-white border border-linha rounded-2xl p-6 scroll-mt-24" aria-labelledby="titulo-citar">
              <h2 id="titulo-citar" className="text-xl font-semibold text-brand-600">Como citar</h2>
              <div className="mt-4 flex gap-2" role="tablist" aria-label="Formato da citação">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={format === f.id}
                    onClick={() => setFormat(f.id)}
                    className={`h-8 px-4 rounded-lg text-xs font-semibold border transition-colors ${
                      format === f.id
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-white border-linha text-brand-600 hover:border-brand-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <pre
                role="tabpanel"
                className="mt-4 bg-creme rounded-lg p-4 text-[13px] leading-relaxed whitespace-pre-wrap break-anywhere font-sans"
              >
                {reference}
              </pre>
              <button type="button" onClick={copyReference} className={`${outlineButton} mt-4 !h-9 !text-[13px]`}>
                {copied ? <Check className="w-4 h-4 text-verde-600" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? 'Referência copiada' : 'Copiar referência'}
              </button>
            </section>

            <section className="bg-white border border-linha rounded-2xl p-6" aria-labelledby="titulo-relacionados">
              <h2 id="titulo-relacionados" className="text-xl font-semibold text-brand-600">Artigos relacionados</h2>
              <ul className="mt-4 divide-y divide-linha">
                {(related.length > 0 ? related : [null, null, null]).map((rel, i) => (
                  <li key={rel?.id ?? `vazio-${i}`} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1">
                    {rel ? (
                      <Link to={`/article/${rel.id}`} className="text-[15px] font-semibold text-brand-600 leading-snug hover:text-verde-600 break-anywhere">
                        {rel.title}
                      </Link>
                    ) : (
                      <span className="text-[15px] font-semibold text-brand-600">—</span>
                    )}
                    <span className="text-xs">
                      {rel ? (magazineById.get(rel.magazine_id)?.name ?? '—') : '—'} · {rel ? formatYear(rel.publication_date) : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
