import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Bookmark, Check, Clock, Download, Quote } from 'lucide-react'
import { fetchHistory, fetchSaved } from '../api/account'
import { searchArticles } from '../api/articles'
import HistorySearch from '../components/account/HistorySearch'
import { useAlertAction } from '../components/account/useAlertAction'
import { useAuth } from '../context/AuthContext'
import { useMagazines } from '../hooks/useMagazines'
import { AREAS, inferArea } from '../data/areas'
import { buildCitation, doiUrl } from '../lib/citation'
import { historyMeta, repeatLink } from '../lib/history'
import { NO_FILTERS } from '../lib/searchDefaults'
import { parseUtc, timeAgo } from '../lib/time'
import type { Article, HistoryEntry, SavedArticle } from '../types'
import iconArrow from '../assets/icons/arrow-right.svg'

const outline =
  'h-9 px-3.5 rounded-lg bg-white border border-linha inline-flex items-center gap-1.5 text-[13px] font-semibold ' +
  'text-brand-600 hover:border-brand-300 transition-colors'

function SectionHead({ title, text, to, link }: { title: string; text?: string; to?: string; link?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h2 className="text-[26px] sm:text-[32px] font-semibold">{title}</h2>
        {text && <p className="mt-1 text-sm">{text}</p>}
      </div>
      {to && link && (
        <Link to={to} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-verde-600 hover:text-verde-700">
          {link}
          <img src={iconArrow} alt="" aria-hidden="true" className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

const FRESH_DAYS = 14

export default function LoggedHome() {
  const { user, toggleSaved } = useAuth()
  const { magazines } = useMagazines()
  const alerts = useAlertAction()
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [saved, setSaved] = useState<SavedArticle[] | null>(null)
  const [fresh, setFresh] = useState<{ article: Article; area?: string }[] | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  const magById = new Map(magazines.map((m) => [m.id, m]))
  const areaKey = (user?.areas ?? []).join('|')

  useEffect(() => {
    let active = true
    fetchHistory({ limit: 30 })
      .then((h) => active && setHistory(h))
      .catch(() => active && setHistory([]))
    fetchSaved()
      .then((s) => active && setSaved(s))
      .catch(() => active && setSaved([]))
    return () => {
      active = false
    }
  }, [user?.saved_count])

  // "Novos nas suas areas": artigos recentes das areas escolhidas no cadastro
  useEffect(() => {
    let active = true
    const chosen = AREAS.filter((a) => (user?.areas ?? []).includes(a.label))
    if (chosen.length === 0) {
      setFresh([])
      return
    }
    Promise.all(
      chosen.map((a) =>
        searchArticles({ query: a.term, searchType: 'simple', filters: NO_FILTERS, page: 1, limit: 4 })
          .then((res) => res.articles.map((article) => ({ article, area: a.label })))
          .catch(() => []),
      ),
    ).then((groups) => {
      if (!active) return
      const seen = new Set<number>()
      const merged = groups
        .flat()
        .filter((x) => (seen.has(x.article.id) ? false : (seen.add(x.article.id), true)))
        .slice(0, 4)
      setFresh(merged)
    })
    return () => {
      active = false
    }
  }, [areaKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null
  const firstName = user.name.trim().split(/\s+/)[0]

  // Buscas distintas, da mais recente para a mais antiga
  const distinct: HistoryEntry[] = []
  for (const e of history ?? []) if (!distinct.some((d) => d.query.toLowerCase() === e.query.toLowerCase())) distinct.push(e)

  async function copyCitation(a: Article) {
    try {
      await navigator.clipboard.writeText(buildCitation(a, magById.get(a.magazine_id)))
      setCopied(a.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Sem permissao de area de transferencia
    }
  }

  const cardMeta = (a: Article) =>
    [(a.authors ?? []).slice(0, 2).join('; ') || '—', magById.get(a.magazine_id)?.name ?? '—', a.publication_date ? new Date(a.publication_date).getFullYear() : '—'].join(' · ')

  return (
    <main className="flex-1 bg-creme">
      <section className="bg-brand-600">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-10 lg:py-12">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 min-w-0">
              <p className="text-amarelo-400 text-[13px] font-semibold uppercase tracking-[0.12em]">
                Bom te ver de novo, {firstName}
              </p>
              <h1 className="mt-3 !text-creme font-bold text-[32px] sm:text-[44px] leading-[1.1]">
                O que você quer pesquisar hoje?
              </h1>
            </div>
            <div className="hidden md:block shrink-0" aria-hidden="true">
              <img src="/bbcc-logo/svg/animado/bbcc-carregando-claro.svg" alt="" className="w-[110px] h-[110px]" />
            </div>
          </div>

          <div className="mt-6">
            <HistorySearch />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-tinta-claro">
            <span>Suas buscas recentes:</span>
            {distinct.slice(0, 3).map((e) => (
              <Link
                key={e.id}
                to={repeatLink(e.query)}
                className="h-[34px] px-3.5 inline-flex items-center gap-2 rounded-full text-sm text-creme border border-creme/35 hover:bg-creme/10 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {e.query}
              </Link>
            ))}
            {distinct.length === 0 && history !== null && <span>nenhuma ainda</span>}
            <Link to="/conta/historico" className="font-semibold text-amarelo-400 hover:text-amarelo-200">
              ver histórico →
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pb-14 lg:pb-20">
        {/* Continue de onde parou */}
        <section className="pt-12 lg:pt-16 flex flex-col gap-6" aria-labelledby="continue">
          <div id="continue">
            <SectionHead title="Continue de onde parou" text="Suas últimas buscas, prontas para repetir." to="/conta/historico" link="Ver histórico completo" />
          </div>
          {distinct.length === 0 ? (
            <p className="bg-white border border-linha rounded-2xl p-6 text-sm">
              {history === null
                ? 'Carregando…'
                : user.save_history
                  ? 'Suas buscas aparecem aqui assim que você pesquisar.'
                  : 'O histórico está desligado. Ative em Histórico de buscas para guardar suas pesquisas.'}
            </p>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {distinct.slice(0, 3).map((e) => (
                <li key={e.id} className="bg-white border border-linha rounded-2xl p-5 flex flex-col gap-3">
                  <p className="inline-flex items-center gap-2 text-xs">
                    <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 inline-flex items-center justify-center">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                    </span>
                    {timeAgo(e.created_at)}
                  </p>
                  <h3 className="text-[22px] font-semibold leading-snug break-anywhere">{e.query}</h3>
                  <p className="text-[13px] pb-3 border-b border-linha">{historyMeta(e)}</p>
                  <div className="flex gap-2">
                    <Link to={repeatLink(e.query)} className={outline}>
                      Repetir busca
                    </Link>
                    <button type="button" onClick={() => alerts.add(e.query)} disabled={alerts.has(e.query)} className={outline}>
                      {alerts.has(e.query) ? <Check className="w-3.5 h-3.5 text-verde-600" /> : <Bell className="w-3.5 h-3.5" />}
                      {alerts.has(e.query) ? 'Alerta criado' : 'Criar alerta'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {alerts.error && <p role="alert" className="text-sm text-red-800">{alerts.error}</p>}
        </section>

        {/* Artigos salvos */}
        <section className="pt-12 lg:pt-16 flex flex-col gap-6" aria-labelledby="salvos">
          <div id="salvos">
            <SectionHead title="Seus artigos salvos" to="/conta/salvos" link="Ver todos os salvos" />
          </div>
          {saved !== null && saved.length === 0 ? (
            <p className="bg-white border border-linha rounded-2xl p-6 text-sm">
              Nenhum artigo salvo ainda. Use o botão <strong>Salvar</strong> na página de um artigo para guardá-lo aqui.
            </p>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(saved ?? []).slice(0, 3).map(({ article }) => {
                const area = inferArea(article)
                const link = article.url || doiUrl(article.doi)
                return (
                  <li key={article.id} className="bg-white border border-linha rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="h-6 px-2.5 inline-flex items-center rounded-full bg-verde-50 text-verde-600 text-[11px] font-semibold">
                        {area?.label ?? '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSaved(article.id).catch(() => null)}
                        aria-label="Remover dos salvos"
                        title="Remover dos salvos"
                        className="text-verde-600 hover:text-verde-700"
                      >
                        <Bookmark className="w-4 h-4 fill-current" aria-hidden="true" />
                      </button>
                    </div>
                    <h3 className="text-xl font-semibold leading-snug line-clamp-3 break-anywhere">
                      <Link to={`/article/${article.id}`} className="hover:text-brand-700">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-xs pb-3 border-b border-linha">{cardMeta(article)}</p>
                    <div className="flex gap-2">
                      {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className={outline}>
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          PDF
                        </a>
                      ) : (
                        <span className={`${outline} opacity-50`}>
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          PDF
                        </span>
                      )}
                      <button type="button" onClick={() => copyCitation(article)} className={outline}>
                        {copied === article.id ? <Check className="w-3.5 h-3.5 text-verde-600" /> : <Quote className="w-3.5 h-3.5" />}
                        {copied === article.id ? 'Copiada' : 'Citar'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Novos nas suas areas */}
        <section className="pt-12 lg:pt-16 flex flex-col gap-6" aria-labelledby="novos">
          <div id="novos" className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[26px] sm:text-[32px] font-semibold">Novos nas suas áreas</h2>
              <p className="mt-1 text-sm">A partir das áreas que você escolheu no cadastro.</p>
            </div>
            <Link to="/conta/perfil" className={`${outline} !h-10`}>
              Gerenciar áreas
            </Link>
          </div>
          {fresh !== null && fresh.length === 0 ? (
            <p className="bg-white border border-linha rounded-2xl p-6 text-sm">
              Escolha suas áreas de interesse em <Link to="/conta/perfil" className="font-semibold text-verde-600">Meu perfil</Link> para
              ver aqui os artigos mais recentes delas.
            </p>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2">
              {(fresh ?? []).map(({ article, area }) => {
                const isNew = Date.now() - parseUtc(article.created_at).getTime() < FRESH_DAYS * 86400000
                return (
                  <li key={article.id} className="bg-white border border-linha rounded-2xl p-5 flex flex-col gap-2.5">
                    <div className="flex gap-2">
                      <span className="h-6 px-2.5 inline-flex items-center rounded-full bg-verde-50 text-verde-600 text-[11px] font-semibold">
                        {area ?? '—'}
                      </span>
                      {isNew && (
                        <span className="h-6 px-2.5 inline-flex items-center rounded-full bg-amarelo-100 text-[#8a6a00] text-[11px] font-semibold">
                          Nova
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold leading-snug break-anywhere">
                      <Link to={`/article/${article.id}`} className="hover:text-brand-700">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-xs">{cardMeta(article)}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
