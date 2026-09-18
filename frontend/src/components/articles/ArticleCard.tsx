import { ExternalLink, ArrowRight } from 'lucide-react'
import type { Article, Magazine } from '../../types'

interface ArticleCardProps {
  article: Article
  magazine?: Magazine
  onClick: () => void
}

function formatYear(dateStr?: string): string {
  if (!dateStr) return ''
  const year = new Date(dateStr).getFullYear()
  return isNaN(year) ? '' : year.toString()
}

function formatAuthors(authors: string[]): string {
  if (authors.length <= 3) return authors.join('; ')
  return `${authors.slice(0, 3).join('; ')} e mais ${authors.length - 3}`
}

export default function ArticleCard({ article, magazine, onClick }: ArticleCardProps) {
  const year = formatYear(article.publication_date)
  const authors = article.authors ?? []
  const keywords = article.keywords ?? []
  const abstract = article.abstract ?? ''

  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir artigo: ${article.title}`}
      className="group bg-white rounded-xl border border-brand-100 shadow-card p-4 sm:p-5
                 hover:border-brand-300 hover:shadow-card-hover transition-all cursor-pointer"
    >
      {/* Procedencia: revista e ano */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {magazine && (
          <span className="text-xs font-semibold text-verde-700 bg-verde-50 border border-verde-100
                           px-2 py-0.5 rounded">
            {magazine.name}
          </span>
        )}
        {year && <span className="text-xs text-tinta/70 tabular-nums">{year}</span>}
      </div>

      <h2
        className="text-[0.95rem] sm:text-base font-semibold text-brand-600 leading-snug break-anywhere
                   group-hover:text-brand-700 transition-colors line-clamp-3"
      >
        {article.title}
      </h2>

      {authors.length > 0 && (
        <p className="mt-1.5 text-sm text-tinta/70 break-anywhere line-clamp-2">
          {formatAuthors(authors)}
        </p>
      )}

      {abstract && (
        <p className="mt-2.5 text-sm text-tinta leading-relaxed line-clamp-2 sm:line-clamp-3">
          {abstract}
        </p>
      )}

      {keywords.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {keywords.slice(0, 5).map((kw, i) => (
            <li
              key={`${kw}-${i}`}
              /* no celular mostramos menos etiquetas para o cartao nao virar um bloco de texto */
              className={`text-xs text-tinta bg-brand-50 px-2 py-0.5 rounded max-w-full truncate ${
                i >= 3 ? 'hidden sm:inline-block' : ''
              }`}
            >
              {kw}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 pt-3 border-t border-brand-50 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
          Ver detalhes
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>

        {article.doi && (
          <a
            href={article.doi}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-tinta/70 hover:text-brand-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Publicação original
          </a>
        )}
      </div>
    </article>
  )
}
