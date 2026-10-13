import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Search, TrendingUp, X } from 'lucide-react'
import { clearHistory, deleteHistoryEntry, fetchHistory } from '../../api/account'
import { timeAgo } from '../../lib/time'
import { repeatLink } from '../../lib/history'
import type { HistoryEntry } from '../../types'

/** Campo de busca do usuario logado: ao clicar, mostra as buscas anteriores, cada uma removivel. */
export default function HistorySearch() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!open) return
    fetchHistory({ limit: 30 })
      .then(setEntries)
      .catch(() => setEntries([]))
  }, [open])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Sem repetir a mesma busca, e filtrando pelo que esta sendo digitado
  const visible = useMemo(() => {
    const seen = new Set<string>()
    const q = text.trim().toLowerCase()
    return entries
      .filter((e) => {
        const key = e.query.toLowerCase()
        if (seen.has(key) || (q && !key.includes(q))) return false
        seen.add(key)
        return true
      })
      .slice(0, 4)
  }, [entries, text])

  function submit(e: FormEvent) {
    e.preventDefault()
    setOpen(false)
    navigate(`/artigos?q=${encodeURIComponent(text.trim())}`)
  }

  async function remove(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    deleteHistoryEntry(id).catch(() => null)
  }

  async function clearAll() {
    setEntries([])
    clearHistory().catch(() => null)
  }

  return (
    <form ref={ref} onSubmit={submit} role="search" className="relative">
      <div className="bg-white border border-linha rounded-[14px] p-2 pl-5 flex items-center gap-3">
        <Search className="w-[22px] h-[22px] text-tinta shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          aria-label="Buscar artigos"
          aria-expanded={open}
          placeholder="Título, autor, palavra-chave ou DOI"
          className="flex-1 min-w-0 h-12 bg-transparent text-base sm:text-[17px] text-brand-700
                     placeholder:text-[#6b6b6b] focus:outline-none !ring-0"
        />
        <button
          type="submit"
          className="h-12 px-6 rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white font-semibold text-base transition-colors"
        >
          Buscar
        </button>
      </div>

      {open && visible.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-linha rounded-[14px] shadow-card-hover z-30 overflow-hidden text-left">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-tinta">Buscas recentes</p>
            <button type="button" onClick={clearAll} className="text-xs font-semibold text-verde-600 hover:text-verde-700">
              Limpar
            </button>
          </div>
          <ul>
            {visible.map((entry) => (
              <li key={entry.id} className="flex items-center border-t border-linha first:border-t-0">
                <Link
                  to={repeatLink(entry.query)}
                  onClick={() => setOpen(false)}
                  className="flex-1 min-w-0 flex items-center gap-3 px-5 py-3 hover:bg-brand-50 transition-colors"
                >
                  <Clock className="w-4 h-4 text-tinta shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-brand-600 truncate">{entry.query}</span>
                    <span className="block text-xs truncate">
                      {entry.kind === 'publicacoes' ? 'Publicações' : entry.kind} · {timeAgo(entry.created_at)}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  aria-label={`Remover "${entry.query}" do histórico`}
                  className="p-3 mr-2 text-tinta hover:text-brand-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <Link
            to="/conta/historico"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-5 py-3 border-t border-linha text-[13px] font-semibold text-verde-600 hover:bg-brand-50"
          >
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              Ver todo o histórico de buscas
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </form>
  )
}
