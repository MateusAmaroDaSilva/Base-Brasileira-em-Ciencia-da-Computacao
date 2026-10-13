import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Search, X } from 'lucide-react'
import { createAlert, deleteAlert, fetchAlerts } from '../api/account'
import { apiErrorMessage } from '../api/client'
import { repeatLink } from '../lib/history'
import { parseUtc } from '../lib/time'
import type { Alert } from '../types'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .catch(() => setError('Não foi possível carregar seus alertas.'))
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setError(null)
    try {
      const alert = await createAlert(text.trim())
      setAlerts((prev) => [alert, ...(prev ?? []).filter((a) => a.id !== alert.id)])
      setText('')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível criar o alerta.'))
    }
  }

  async function remove(id: number) {
    setAlerts((prev) => (prev ?? []).filter((a) => a.id !== id))
    deleteAlert(id).catch(() => setError('Não foi possível remover o alerta.'))
  }

  return (
    <section aria-labelledby="titulo-alertas">
      <h1 id="titulo-alertas" className="text-[34px] lg:text-[42px] font-semibold">Alertas</h1>
      <p className="mt-2 text-sm">Transforme uma busca em alerta para acompanhar artigos novos sobre o assunto.</p>

      <p className="mt-4 text-[13px] bg-amarelo-100 border border-amarelo-200 text-[#6b5200] rounded-lg px-4 py-3">
        As buscas já ficam guardadas aqui, mas o envio dos e-mails de aviso ainda não está ativo.
      </p>

      <form onSubmit={add} className="mt-5 flex gap-3 flex-wrap sm:flex-nowrap">
        <label className="flex-1 min-w-[200px] h-11 bg-white border border-linha rounded-[10px] flex items-center gap-2.5 px-3.5 focus-within:border-brand-300">
          <Search className="w-4 h-4 text-tinta shrink-0" aria-hidden="true" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Busca para acompanhar, ex.: aprendizado de máquina"
            aria-label="Busca para criar o alerta"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm !ring-0"
          />
        </label>
        <button
          type="submit"
          disabled={!text.trim()}
          className="h-11 px-5 rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-60"
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          Criar alerta
        </button>
      </form>

      {error && <p role="alert" className="mt-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3">{error}</p>}

      {alerts !== null && alerts.length === 0 ? (
        <p className="mt-6 bg-white border border-linha rounded-2xl p-8 text-center text-sm">Você ainda não tem alertas.</p>
      ) : (
        <ul className="mt-6 bg-white border border-linha rounded-2xl divide-y divide-linha overflow-hidden">
          {(alerts ?? []).map((a) => (
            <li key={a.id} className="p-4 flex items-center gap-4">
              <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 inline-flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-brand-600 break-anywhere">{a.query}</p>
                <p className="text-xs">criado em {parseUtc(a.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <Link
                to={repeatLink(a.query)}
                className="h-9 px-3 rounded-lg bg-white border border-linha inline-flex items-center text-[13px] font-semibold text-brand-600 hover:border-brand-300"
              >
                Ver resultados
              </Link>
              <button type="button" onClick={() => remove(a.id)} aria-label={`Remover o alerta "${a.query}"`} className="p-2 text-tinta hover:text-brand-600">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
