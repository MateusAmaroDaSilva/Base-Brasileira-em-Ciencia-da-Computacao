import { Calendar, Users, ExternalLink, BookOpen } from 'lucide-react'
import type { Article, Magazine } from '../../types'

interface ArticleCardProps {
  article: Article
  magazine?: Magazine
  onClick: () => void
}

function formatYear(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).getFullYear().toString()
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '…'
}

export default function ArticleCard({ article, magazine, onClick }: ArticleCardProps) {
  const year = formatYear(article.publication_date)
  const authors = article.authors ?? []
  const keywords = article.keywords ?? []
  const abstract = article.abstract ?? ''

  return (
    <article
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md
                 hover:border-blue-200 transition-all cursor-pointer group p-5"
    >
      {/* Magazine + year */}
      <div className="flex items-center gap-2 mb-2">
        {magazine && (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50
                           px-2 py-0.5 rounded-full">
            <BookOpen className="w-3 h-3" />
            {magazine.name}
          </span>
        )}
        {year && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            {year}
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-700
                     transition-colors leading-snug mb-2">
        {article.title}
      </h2>

      {/* Authors */}
      {authors.length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {authors.slice(0, 3).join('; ')}
            {authors.length > 3 && ` +${authors.length - 3}`}
          </span>
        </p>
      )}

      {/* Abstract snippet */}
      {abstract && (
        <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-3">
          {truncate(abstract, 300)}
        </p>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.slice(0, 5).map((kw, i) => (
            <span
              key={i}
              className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
            >
              {kw}
            </span>
          ))}
          {keywords.length > 5 && (
            <span className="text-xs text-slate-400 px-2 py-0.5">
              +{keywords.length - 5}
            </span>
          )}
        </div>
      )}

      {/* DOI link */}
      {article.doi && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <a
            href={article.doi}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            DOI
          </a>
        </div>
      )}
    </article>
  )
}
