import { FileSearch } from 'lucide-react'
import ArticleCard from './ArticleCard'
import type { Article, Magazine } from '../../types'

interface ArticleListProps {
  articles: Article[]
  magazines: Magazine[]
  loading: boolean
  onArticleClick: (id: number) => void
}

export default function ArticleList({ articles, magazines, loading, onArticleClick }: ArticleListProps) {
  const magById = Object.fromEntries(magazines.map((m) => [m.id, m]))

  if (loading) {
    return (
      <div
        className="bg-white rounded-xl border border-brand-100 shadow-card flex flex-col items-center
                   justify-center text-center py-16 px-6"
        aria-busy="true"
        aria-live="polite"
      >
        <img src="/bbcc-logo/svg/animado/bbcc-carregando.svg" alt="" aria-hidden="true" className="w-24 h-24" />
        <p className="mt-3 text-sm text-tinta/70">Buscando artigos…</p>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-brand-100 shadow-card flex flex-col items-center
                      justify-center text-center py-14 px-6">
        <FileSearch className="w-12 h-12 text-brand-200 mb-3" aria-hidden="true" />
        <p className="text-base font-semibold text-tinta">Nenhum artigo encontrado</p>
        <p className="text-sm text-tinta/70 mt-1 max-w-sm">
          Tente outras palavras, use termos mais gerais ou remova alguns filtros.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          magazine={magById[article.magazine_id]}
          onClick={() => onArticleClick(article.id)}
        />
      ))}
    </div>
  )
}
