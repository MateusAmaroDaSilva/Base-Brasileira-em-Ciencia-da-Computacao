import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Telas da conta: sem login, vai para Entrar e volta para ca depois. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-24" aria-busy="true">
        <img src="/bbcc-logo/svg/animado/bbcc-carregando.svg" alt="Carregando…" className="w-24 h-24" />
      </main>
    )
  }
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  return <>{children}</>
}
