import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from '../api/account'
import { clearToken, readToken, storeToken } from '../api/client'
import type { User } from '../types'

interface AuthState {
  user: User | null
  /** true enquanto confirma com o servidor o token guardado */
  loading: boolean
  savedIds: Set<number>
  login: (email: string, password: string, remember: boolean) => Promise<void>
  register: (data: api.RegisterData) => Promise<void>
  logout: () => void
  updateUser: (patch: Parameters<typeof api.updateMe>[0]) => Promise<void>
  /** Envia a foto de perfil (ja reduzida) ou, com null, remove */
  setAvatar: (image: Blob | null) => Promise<void>
  /** Salva ou remove o artigo da lista do usuario; devolve o novo estado */
  toggleSaved: (articleId: number) => Promise<boolean>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => readToken() !== null)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())

  const loadSaved = useCallback(() => {
    api
      .fetchSavedIds()
      .then((ids) => setSavedIds(new Set(ids)))
      .catch(() => null)
  }, [])

  // Retoma a sessao guardada; token invalido ou vencido e descartado
  useEffect(() => {
    if (readToken() === null) return
    let active = true
    api
      .fetchMe()
      .then((u) => {
        if (!active) return
        setUser(u)
        loadSaved()
      })
      .catch((err) => {
        if (err?.response?.status === 401) clearToken()
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [loadSaved])

  const finishAuth = useCallback(
    (res: { access_token: string; user: User }, remember: boolean) => {
      storeToken(res.access_token, remember)
      setUser(res.user)
      loadSaved()
    },
    [loadSaved],
  )

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      savedIds,
      login: async (email, password, remember) => finishAuth(await api.login(email, password, remember), remember),
      register: async (data) => finishAuth(await api.register(data), false),
      logout: () => {
        clearToken()
        setUser(null)
        setSavedIds(new Set())
      },
      updateUser: async (patch) => setUser(await api.updateMe(patch)),
      setAvatar: async (image) => {
        if (image) {
          setUser(await api.uploadAvatar(image))
        } else {
          await api.removeAvatar()
          setUser((u) => (u ? { ...u, avatar_url: null } : u))
        }
      },
      toggleSaved: async (articleId) => {
        const wasSaved = savedIds.has(articleId)
        await (wasSaved ? api.unsaveArticle(articleId) : api.saveArticle(articleId))
        setSavedIds((prev) => {
          const next = new Set(prev)
          if (wasSaved) next.delete(articleId)
          else next.add(articleId)
          return next
        })
        setUser((u) => (u ? { ...u, saved_count: Math.max(0, u.saved_count + (wasSaved ? -1 : 1)) } : u))
        return !wasSaved
      },
    }),
    [user, loading, savedIds, finishAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
