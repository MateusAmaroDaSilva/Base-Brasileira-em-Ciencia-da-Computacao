import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { fetchSaved } from '../api/account'
import { useAuth } from '../context/AuthContext'
import { useMagazines } from '../hooks/useMagazines'
import { inferArea } from '../data/areas'
import type { SavedArticle } from '../types'

export default function SavedPage() {
  const { toggleSaved, user } = useAuth()
  const { magazines } = useMagazines()
  const [items, setItems] = useState<SavedArticle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSaved()
      .then(setItems)
      .catch(() => setError('Não foi possível carregar seus artigos salvos.'))
  }, [])

  const magById = new Map(magazines.map((m) => [m.id, m.name]))

  async function remove(id: number) {
    try {
      await toggleSaved(id)
      setItems((prev) => (prev ?? []).filter((i) => i.article.id !== id))
    } catch {
      setError('Não foi possível remover o artigo.')
    }
  }

  return (
    <section aria-labelledby="titulo-salvos">
      <h1 id="titulo-salvos" className="text-[34px] lg:text-[42px] font-semibold">Artigos salvos</h1>
      <p className="mt-2 text-sm">
        {user?.saved_count ?? 0} {user?.saved_count === 1 ? 'artigo guardado' : 'artigos guardados'} para ler depois.
      </p>

      {error && <p role="alert" className="mt-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3">{error}</p>}

      {items !== null && items.length === 0 ? (
        <p className="mt-6 bg-white border border-linha rounded-2xl p-8 text-center text-sm">
          Nenhum artigo salvo ainda. Use o botão <strong>Salvar</strong> na página de um artigo para guardá-lo aqui.
        </p>
      ) : (
        <ul className="mt-6 bg-white border border-linha rounded-2xl divide-y divide-linha overflow-hidden">
          {(items ?? []).map(({ article, saved_at }) => (
            <li key={article.id} className="p-5 flex items-start gap-4">
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <span className="self-start h-6 px-2.5 inline-flex items-center rounded-full bg-verde-50 text-verde-600 text-[11px] font-semibold">
                  {inferArea(article)?.label ?? '—'}
                </span>
                <h2 className="text-xl font-semibold leading-snug break-anywhere">
                  <Link to={`/article/${article.id}`} className="hover:text-brand-700">
                    {article.title}
                  </Link>
                </h2>
                <p className="text-[13px] italic line-clamp-2">{(article.authors ?? []).join(' · ') || '—'}</p>
                <p className="text-xs">
                  {magById.get(article.magazine_id) ?? '—'} · {article.publication_date ? new Date(article.publication_date).getFullYear() : '—'} · salvo em{' '}
                  {new Date(/Z|[+-]\d\d:?\d\d$/.test(saved_at) ? saved_at : `${saved_at}Z`).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(article.id)}
                className="h-9 px-3 rounded-lg bg-white border border-linha inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:border-brand-300 shrink-0"
              >
                <Bookmark className="w-3.5 h-3.5 fill-current text-verde-600" aria-hidden="true" />
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
