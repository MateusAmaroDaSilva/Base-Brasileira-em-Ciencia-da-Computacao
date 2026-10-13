import { NavLink, Outlet } from 'react-router-dom'
import { Bell, Bookmark, Clock, LayoutGrid, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from './Avatar'

const items = [
  { to: '/conta', label: 'Meu painel', icon: LayoutGrid, end: true },
  { to: '/conta/historico', label: 'Histórico de buscas', icon: Clock },
  { to: '/conta/salvos', label: 'Artigos salvos', icon: Bookmark },
  { to: '/conta/alertas', label: 'Alertas', icon: Bell },
  { to: '/conta/perfil', label: 'Meu perfil', icon: UserIcon },
]

/** Moldura das telas "Minha conta": cartao do usuario e menu lateral. */
export default function AccountLayout() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <main className="flex-1 bg-creme">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-8 lg:py-10 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="Minha conta">
          <div className="bg-white border border-linha rounded-2xl p-4 flex items-center gap-3">
            <Avatar user={user} className="w-11 h-11 text-sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-600 truncate">{user.name}</p>
              <p className="text-xs truncate">{user.institution || '—'}</p>
            </div>
          </div>

          <nav className="bg-white border border-linha rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto" aria-label="Seções da conta">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `h-11 px-3.5 rounded-lg inline-flex items-center gap-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive ? 'bg-brand-600 text-white' : 'text-tinta hover:bg-brand-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  )
}
