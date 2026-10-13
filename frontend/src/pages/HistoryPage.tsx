import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Clock, Download, RotateCw, Search, Trash2, X } from 'lucide-react'
import { clearHistory, deleteHistoryEntry, fetchHistory, fetchSaved, fetchTopSearches } from '../api/account'
import { useAlertAction } from '../components/account/useAlertAction'
import { useAuth } from '../context/AuthContext'
import { useMagazines } from '../hooks/useMagazines'
import { downloadCsv } from '../lib/csv'
import { historyMeta, repeatLink } from '../lib/history'
import { historyGroup, parseUtc, timeAgo, type HistoryGroup } from '../lib/time'
import type { HistoryEntry, SavedArticle, TopSearch } from '../types'

const PERIODS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '', label: 'Todo o período' },
]
const GROUP_ORDER: HistoryGroup[] = ['Hoje', 'Ontem', 'Semana passada', 'Mais antigas']

const rowButton =
  'h-9 px-3 rounded-lg bg-white border border-linha inline-flex items-center gap-1.5 text-[13px] font-semibold ' +
  'text-brand-600 hover:border-brand-300 transition-colors disabled:opacity-70'

export default function HistoryPage() {
  const { user, updateUser } = useAuth()
  const { magazines } = useMagazines()
  const alerts = useAlertAction()
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [top, setTop] = useState<TopSearch[]>([])
  const [saved, setSaved] = useState<SavedArticle[]>([])
  const [text, setText] = useState('')
  const [days, setDays] = useState('30')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchHistory({ days: days ? Number(days) : undefined, q: text.trim() || undefined })
      .then(setEntries)
      .catch(() => setError('Não foi possível carregar o histórico.'))
  }, [days, text])

  // Espera um instante depois de digitar para nao pedir a cada letra
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    fetchTopSearches(4).then(setTop).catch(() => null)
    fetchSaved().then(setSaved).catch(() => null)
  }, [])

  const groups = useMemo(() => {
    const map = new Map<HistoryGroup, HistoryEntry[]>()
    for (const e of entries ?? []) {
      const g = historyGroup(e.created_at)
      map.set(g, [...(map.get(g) ?? []), e])
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }))
  }, [entries])

  const magById = new Map(magazines.map((m) => [m.id, m.name]))
  if (!user) return null

  async function remove(id: number) {
    setEntries((prev) => (prev ?? []).filter((e) => e.id !== id))
    deleteHistoryEntry(id).catch(load)
  }

  async function clearAll() {
    if (!window.confirm('Apagar todo o histórico de buscas? Isso não pode ser desfeito.')) return
    setEntries([])
    setTop([])
    await clearHistory().catch(load)
  }

  async function toggleHistory(on: boolean) {
    if (!on && !window.confirm('Ao desligar, o histórico guardado será apagado. Continuar?')) return
    try {
      await updateUser({ save_history: on })
      if (!on) {
        setEntries([])
        setTop([])
      }
    } catch {
      setError('Não foi possível alterar essa configuração.')
    }
  }

  function exportCsv() {
    downloadCsv('bbcc-historico-de-buscas.csv', [
      ['Busca', 'Tipo', 'Área', 'Resultados', 'Data'],
      ...(entries ?? []).map((e) => [e.query, e.kind, e.area, e.result_count, parseUtc(e.created_at).toISOString()]),
    ])
  }

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_280px] gap-8 items-start">
      <section aria-labelledby="titulo-historico" className="min-w-0">
        <h1 id="titulo-historico" className="text-[34px] lg:text-[42px] font-semibold">Histórico de buscas</h1>
        <p className="mt-2 text-sm">Tudo o que você pesquisou enquanto estava com a conta aberta.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <label className="flex-1 min-w-[180px] h-11 bg-white border border-linha rounded-[10px] flex items-center gap-2.5 px-3.5 focus-within:border-brand-300">
            <Search className="w-4 h-4 text-tinta shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Buscar no histórico"
              aria-label="Buscar no histórico"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm !ring-0"
            />
          </label>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            aria-label="Período"
            className="h-11 px-3.5 rounded-[10px] bg-white border border-linha text-sm font-semibold text-brand-600 cursor-pointer"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={exportCsv} disabled={!entries?.length} className={`${rowButton} !h-11 !px-4`}>
            <Download className="w-4 h-4" aria-hidden="true" />
            Exportar
          </button>
          <button type="button" onClick={clearAll} disabled={!entries?.length} className={`${rowButton} !h-11 !px-4`}>
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Limpar histórico
          </button>
        </div>

        <div className="mt-4 bg-amarelo-100 border border-amarelo-200 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-600">Salvar meu histórico de buscas</p>
            <p className="text-xs text-[#8a6a00]">Você pode desligar quando quiser. Ao desligar, o histórico guardado é apagado.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={user.save_history}
            aria-label="Salvar meu histórico de buscas"
            onClick={() => toggleHistory(!user.save_history)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${user.save_history ? 'bg-verde-600' : 'bg-brand-200'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                user.save_history ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {error && <p role="alert" className="mt-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3">{error}</p>}

        {entries !== null && entries.length === 0 ? (
          <p className="mt-6 bg-white border border-linha rounded-2xl p-8 text-center text-sm">
            {user.save_history
              ? text || days
                ? 'Nenhuma busca encontrada nesse filtro.'
                : 'Suas buscas aparecem aqui assim que você pesquisar.'
              : 'O histórico está desligado: nenhuma busca está sendo guardada.'}
          </p>
        ) : (
          groups.map(({ group, items }) => (
            <div key={group} className="mt-6">
              <h2 className="!font-sans text-xs font-bold tracking-[0.1em] uppercase !text-tinta mb-2">{group}</h2>
              <ul className="bg-white border border-linha rounded-2xl divide-y divide-linha overflow-hidden">
                {items.map((e) => (
                  <li key={e.id} className="p-4 flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                    <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 inline-flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-brand-600 break-anywhere">{e.query}</p>
                      <p className="text-xs">{historyMeta(e)}</p>
                    </div>
                    <span className="text-xs tabular-nums shrink-0 hidden sm:block">{timeAgo(e.created_at)}</span>
                    <Link to={repeatLink(e.query)} className={rowButton}>
                      <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                      Repetir busca
                    </Link>
                    <button type="button" onClick={() => alerts.add(e.query)} disabled={alerts.has(e.query)} className={rowButton}>
                      {alerts.has(e.query) ? <Check className="w-3.5 h-3.5 text-verde-600" /> : <Bell className="w-3.5 h-3.5" />}
                      {alerts.has(e.query) ? 'Criado' : 'Alerta'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      aria-label={`Remover "${e.query}" do histórico`}
                      className="p-2 text-tinta hover:text-brand-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
        {alerts.error && <p role="alert" className="mt-3 text-sm text-red-800">{alerts.error}</p>}
      </section>

      <aside className="flex flex-col gap-5" aria-label="Resumo">
        <section className="bg-white border border-linha rounded-2xl p-5" aria-labelledby="mais-frequentes">
          <h2 id="mais-frequentes" className="text-lg font-semibold">Buscas mais frequentes</h2>
          {top.length === 0 ? (
            <p className="mt-3 text-sm">—</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {top.map((t) => (
                <li key={t.query}>
                  <Link
                    to={repeatLink(t.query)}
                    className="h-9 px-3 rounded-lg bg-brand-50 flex items-center gap-2 text-[13px] text-brand-600 hover:bg-brand-100 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-verde-600 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{t.query}</span>
                    <span className="text-xs tabular-nums">{t.count}×</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-linha rounded-2xl p-5" aria-labelledby="salvos-resumo">
          <div className="flex items-center justify-between">
            <h2 id="salvos-resumo" className="text-lg font-semibold">Artigos salvos</h2>
            <Link to="/conta/salvos" className="text-[13px] font-semibold text-verde-600 hover:text-verde-700">
              Ver todos
            </Link>
          </div>
          {saved.length === 0 ? (
            <p className="mt-3 text-sm">Nenhum artigo salvo ainda.</p>
          ) : (
            <ul className="mt-3 divide-y divide-linha">
              {saved.slice(0, 2).map(({ article }) => (
                <li key={article.id} className="py-3 first:pt-0 last:pb-0">
                  <Link to={`/article/${article.id}`} className="text-sm font-semibold text-brand-600 leading-snug hover:text-verde-600 break-anywhere">
                    {article.title}
                  </Link>
                  <p className="text-xs mt-1">
                    {magById.get(article.magazine_id) ?? '—'} · {article.publication_date ? new Date(article.publication_date).getFullYear() : '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-brand-600 text-white rounded-2xl p-5" aria-labelledby="alertas-resumo">
          <h2 id="alertas-resumo" className="text-lg font-semibold !text-white">Alertas</h2>
          <p className="mt-2 text-[13px] text-tinta-claro leading-relaxed">
            Transforme uma busca em alerta e receba um e-mail quando entrarem artigos novos nela.
          </p>
          <Link
            to="/conta/alertas"
            className="mt-4 h-10 px-4 rounded-lg bg-verde-600 hover:bg-verde-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            Criar alerta
          </Link>
        </section>
      </aside>
    </div>
  )
}
