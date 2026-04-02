import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

interface Article {
  id: number
  title: string
  authors: string[]
  abstract?: string
  keywords?: string[]
  published_date?: string
  magazine_id: number
  url?: string
  doi?: string
  oai_identifier: string
  created_at: string
}

interface Magazine {
  id: number
  title: string
}

const API_BASE_URL = 'http://localhost:8000/api/v1'

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [magazine, setMagazine] = useState<Magazine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchArticleDetails()
    }
  }, [id])

  const fetchArticleDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get<Article>(
        `${API_BASE_URL}/articles/${id}`
      )
      setArticle(response.data)

      // Fetch magazine name
      if (response.data.magazine_id) {
        try {
          const magResponse = await axios.get<Magazine>(
            `${API_BASE_URL}/magazines/${response.data.magazine_id}`
          )
          setMagazine(magResponse.data)
        } catch (err) {
          console.error('Erro ao buscar revista:', err)
        }
      }
    } catch (err) {
      setError('Erro ao carregar detalhes do artigo')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data indisponível'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Erro</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error || 'Artigo não encontrado'}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            ← Voltar
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header com botão voltar */}
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2"
          >
            ← Voltar à Busca
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex-1 text-center">
            📄 Detalhes do Artigo
          </h1>
          <div className="w-24" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Artigo Container */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header do Artigo */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-8">
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              {article.title}
            </h2>

            <div className="flex flex-wrap gap-4 text-indigo-100">
              <div>
                <p className="text-xs opacity-75">Publicado em</p>
                <p className="font-semibold">
                  {formatDate(article.published_date)}
                </p>
              </div>
              {magazine && (
                <div>
                  <p className="text-xs opacity-75">Revista</p>
                  <p className="font-semibold">{magazine.title}</p>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-8 py-8 space-y-8">
            {/* Autores */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                👥 Autores
              </h3>
              <div className="space-y-2">
                {Array.isArray(article.authors) && article.authors.length > 0 ? (
                  article.authors.map((author, idx) => (
                    <p
                      key={idx}
                      className="text-gray-700 bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      {author}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500 italic">Autores desconhecidos</p>
                )}
              </div>
            </section>

            {/* Resumo */}
            {article.abstract && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  📄 Resumo (Abstract)
                </h3>
                <p className="text-gray-700 leading-relaxed bg-blue-50 px-6 py-4 rounded-lg border-l-4 border-blue-500">
                  {article.abstract}
                </p>
              </section>
            )}

            {/* Palavras-chave */}
            {article.keywords && article.keywords.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  🏷️ Palavras-chave
                </h3>
                <div className="flex flex-wrap gap-3">
                  {article.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium hover:bg-indigo-200 transition cursor-pointer"
                    >
                      🔎 {keyword}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Metadados */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                ℹ️ Informações
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold mb-1">
                    ID do Artigo
                  </p>
                  <p className="text-gray-900 font-medium">{article.id}</p>
                </div>

                {article.doi && (
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <p className="text-xs text-gray-500 font-semibold mb-1">
                      DOI
                    </p>
                    <p className="text-gray-900 font-mono text-sm break-all">
                      {article.doi}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold mb-1">
                    Identificador OAI
                  </p>
                  <p className="text-gray-900 font-mono text-xs break-all">
                    {article.oai_identifier}
                  </p>
                </div>

                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold mb-1">
                    Adicionado em
                  </p>
                  <p className="text-gray-900 font-medium">
                    {formatDate(article.created_at)}
                  </p>
                </div>
              </div>
            </section>

            {/* Link para Artigo */}
            {article.url && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  🔗 Acesso
                </h3>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  🌐 Acessar Artigo Original
                  <span className="text-lg">↗</span>
                </a>
              </section>
            )}
          </div>

          {/* Footer do Artigo */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Arquivo referenciado desde{' '}
              <strong>{formatDate(article.created_at)}</strong>
            </p>
          </div>
        </article>

        {/* Botão Voltar no Final */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 border-2 border-indigo-600 transition font-semibold"
          >
            ← Voltar à Busca
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            © 2026 Base Brasileira em Ciência da Computação
          </p>
        </div>
      </footer>
    </div>
  )
}
