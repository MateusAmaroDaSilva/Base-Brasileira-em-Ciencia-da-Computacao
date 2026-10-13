import axios from 'axios'

// Uses Vite's proxy in development (/api → localhost:8000)
// avoiding CORS issues entirely.
const API_BASE_URL = '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// O token fica em localStorage ("lembrar de mim") ou sessionStorage (so ate fechar a aba)
const TOKEN_KEY = 'bbcc:token'

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string, remember: boolean) {
  try {
    clearToken()
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    // Sem armazenamento disponivel: a sessao dura so ate recarregar a pagina
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // nada a limpar
  }
}

apiClient.interceptors.request.use((config) => {
  const token = readToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

/** Mensagem em portugues a partir de um erro da API (422 do FastAPI vem como lista). */
export function apiErrorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  const res = (err as { response?: { status?: number; data?: { detail?: unknown } } })?.response
  if (!res) return 'Não foi possível falar com o servidor. Verifique sua conexão.'
  const detail = res.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; loc?: (string | number)[] }
    const field = first.loc?.[first.loc.length - 1]
    return `${field ? `${field}: ` : ''}${first.msg ?? fallback}`.replace('Value error, ', '')
  }
  return fallback
}
