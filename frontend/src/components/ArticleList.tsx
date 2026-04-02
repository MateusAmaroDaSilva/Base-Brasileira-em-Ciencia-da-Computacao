interface Article {
  id: number
  title: string
  authors: string[]
  published_date: string
  magazine_id: number
}

interface ArticleListProps {
  articles: Article[]
  onArticleClick: (articleId: number) => void
  isLoading?: boolean
}

export default function ArticleList({
  articles,
  onArticleClick,
  isLoading = false,
}: ArticleListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {articles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-lg">Nenhum artigo encontrado</p>
        </div>
      ) : (
        articles.map((article) => (
          <article
            key={article.id}
            onClick={() => onArticleClick(article.id)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all p-6 cursor-pointer"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
              {article.title}
            </h3>
            <p className="text-gray-600 mb-3 line-clamp-1">
              {Array.isArray(article.authors)
                ? article.authors.join(', ')
                : 'Autor desconhecido'}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>📅 {formatDate(article.published_date)}</span>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                ID: {article.id}
              </span>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
