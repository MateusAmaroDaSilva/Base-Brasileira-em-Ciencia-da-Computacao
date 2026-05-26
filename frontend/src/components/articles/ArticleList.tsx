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
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-1/4 mb-3" />
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
      <div className="h-3 bg-slate-200 rounded w-full mb-2" />
      <div className="h-3 bg-slate-200 rounded w-5/6" />
    </div>
  )
}

export default function ArticleList({ articles, magazines, loading, onArticleClick }: ArticleListProps) {
  const magById = Object.fromEntries(magazines.map((m) => [m.id, m]))

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FileSearch className="w-14 h-14 mb-4 opacity-40" />
        <p className="text-lg font-medium text-slate-500">Nenhum artigo encontrado</p>
        <p className="text-sm mt-1">Tente outros termos ou remova alguns filtros</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
