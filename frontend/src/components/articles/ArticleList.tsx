import { FileSearch } from 'lucide-react'
import ArticleCard from './ArticleCard'
import type { Article, Magazine } from '../../types'

interface ArticleListProps {
  articles: Article[]
  magazines: Magazine[]
  loading: boolean
  onArticleClick: (id: number) => void
}

function Skeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 sm:p-5 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
      <div className="h-4 bg-slate-200 rounded w-11/12 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-2/3 mb-4" />
      <div className="h-3 bg-slate-100 rounded w-full mb-2" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
    </div>
  )
}

export default function ArticleList({ articles, magazines, loading, onArticleClick }: ArticleListProps) {
  const magById = Object.fromEntries(magazines.map((m) => [m.id, m]))

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4" aria-busy="true" aria-live="polite">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-card flex flex-col items-center
                      justify-center text-center py-14 px-6">
        <FileSearch className="w-12 h-12 text-slate-300 mb-3" aria-hidden="true" />
        <p className="text-base font-semibold text-slate-700">Nenhum artigo encontrado</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
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
