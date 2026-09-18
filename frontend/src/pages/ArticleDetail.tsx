import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, Tag, ExternalLink, BookOpen, Hash, Globe } from 'lucide-react'
import { fetchArticleById } from '../api/articles'
import { fetchMagazineById } from '../api/magazines'
import type { Article, Magazine } from '../types'

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Data não disponível'
  return new Date(dateStr).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [magazine, setMagazine] = useState<Magazine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchArticleById(parseInt(id))
      .then(async (art) => {
        setArticle(art)
        if (art.magazine_id) {
          fetchMagazineById(art.magazine_id)
            .then(setMagazine)
            .catch(() => null)
        }
      })
      .catch(() => setError('Artigo não encontrado ou erro ao carregar.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-creme flex items-center justify-center">
        <img src="/bbcc-logo/svg/animado/bbcc-carregando.svg" alt="Carregando…" className="w-24 h-24" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-creme flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-tinta text-lg">{error ?? 'Artigo não encontrado'}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brand-700 hover:text-brand-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-creme">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-tinta/70 hover:text-brand-700 text-sm font-medium
                     transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à busca
        </button>

        <article className="bg-white rounded-2xl shadow-card border border-brand-100 overflow-hidden">
          {/* Header */}
          <div className="bg-brand-600 px-5 sm:px-8 py-6 sm:py-8 text-white">
            {/* Magazine + year badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {magazine && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs
                                 px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                  <BookOpen className="w-3 h-3" />
                  {magazine.name}
                </span>
              )}
              {article.publication_date && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs
                                 px-3 py-1 rounded-full">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.publication_date).getFullYear()}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-bold leading-tight mb-4 break-anywhere text-white">
              {article.title}
            </h1>

            {/* Authors */}
            {article.authors && article.authors.length > 0 && (
              <div className="flex items-start gap-2 text-tinta-claro">
                <Users className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-sm break-anywhere">{article.authors.join('; ')}</p>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-5 sm:px-8 py-6 sm:py-8 space-y-7">
            {/* Abstract */}
            {article.abstract && (
              <section>
                <h2 className="text-xs font-semibold text-tinta/50 uppercase tracking-widest mb-3">
                  Resumo
                </h2>
                <p className="text-tinta leading-relaxed text-base bg-creme px-5 py-4
                               rounded-xl border-l-4 border-brand-500">
                  {article.abstract}
                </p>
              </section>
            )}

            {/* Keywords */}
            {article.keywords && article.keywords.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-xs font-semibold text-tinta/50 uppercase tracking-widest mb-3">
                  <Tag className="w-3.5 h-3.5" />
                  Palavras-chave
                </h2>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((kw, i) => (
                    <span key={i} className="text-sm bg-brand-50 text-brand-800 px-3 py-1 rounded-full border border-brand-100">
                      {kw}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Metadata grid */}
            <section>
              <h2 className="text-xs font-semibold text-tinta/50 uppercase tracking-widest mb-3">
                Informações bibliográficas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {article.publication_date && (
                  <div className="flex items-start gap-3 bg-creme rounded-xl px-4 py-3">
                    <Calendar className="w-4 h-4 text-tinta/50 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-tinta/50 mb-0.5">Data de publicação</p>
                      <p className="text-sm text-tinta font-medium">{formatDate(article.publication_date)}</p>
                    </div>
                  </div>
                )}
                {magazine && (
                  <div className="flex items-start gap-3 bg-creme rounded-xl px-4 py-3">
                    <BookOpen className="w-4 h-4 text-tinta/50 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-tinta/50 mb-0.5">Revista</p>
                      <p className="text-sm text-tinta font-medium">{magazine.name}</p>
                    </div>
                  </div>
                )}
                {article.doi && (
                  <div className="flex items-start gap-3 bg-creme rounded-xl px-4 py-3">
                    <Hash className="w-4 h-4 text-tinta/50 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-tinta/50 mb-0.5">DOI</p>
                      <a
                        href={article.doi}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-700 hover:text-brand-900 font-mono break-all transition-colors"
                      >
                        {article.doi}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 bg-creme rounded-xl px-4 py-3">
                  <Globe className="w-4 h-4 text-tinta/50 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-tinta/50 mb-0.5">Identificador OAI</p>
                    <p className="text-xs text-tinta font-mono break-all">{article.oai_identifier}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* External link */}
            {article.url && (
              <div className="pt-2">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700
                             text-white font-semibold px-6 py-3 rounded-xl shadow-card transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Acessar artigo completo
                </a>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
