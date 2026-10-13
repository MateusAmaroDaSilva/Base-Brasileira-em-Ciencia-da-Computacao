import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Bookmark, ChevronDown, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../account/Avatar'

const links = [
  // "Artigos" abre a tela Início; os resultados de busca ficam em /artigos
  { to: '/', label: 'Artigos', end: true, alsoActive: ['/artigos', '/article'] },
  { to: '/revistas', label: 'Revistas' },
  { to: '/areas', label: 'Áreas' },
  { to: '/sobre', label: 'Sobre o projeto' },
]

type NavItem = (typeof links)[number]

const isAlso = (link: NavItem, pathname: string) =>
  'alsoActive' in link && !!link.alsoActive?.some((p) => pathname.startsWith(p))

const navClass = ({ isActive }: { isActive: boolean }) =>
  `py-2 text-[15px] font-medium transition-colors border-b-2 ${
    isActive ? 'text-brand-600 border-verde-600' : 'text-tinta border-transparent hover:text-brand-600'
  }`

const accountLinks = [
  { to: '/conta', label: 'Meu painel' },
  { to: '/conta/historico', label: 'Histórico de buscas' },
  { to: '/conta/salvos', label: 'Artigos salvos' },
  { to: '/conta/alertas', label: 'Alertas' },
  { to: '/conta/perfil', label: 'Meu perfil' },
]

const iconButton =
  'relative h-10 min-w-10 px-2 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-linha ' +
  'bg-white text-brand-600 hover:border-brand-300 transition-colors text-[11px] font-semibold'

function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <Link to="/conta/salvos" className={iconButton} aria-label={`Artigos salvos: ${user.saved_count}`} title="Artigos salvos">
        <Bookmark className="w-4 h-4" aria-hidden="true" />
        <span className="tabular-nums">{user.saved_count}</span>
      </Link>
      <Link to="/conta/alertas" className={iconButton} aria-label="Alertas" title="Alertas">
        <Bell className="w-4 h-4" aria-hidden="true" />
      </Link>

      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="h-11 pl-1.5 pr-3 rounded-full border border-linha bg-white hover:border-brand-300 transition-colors
                     inline-flex items-center gap-2.5"
        >
          <Avatar user={user} className="w-8 h-8 text-xs" />
          <span className="hidden xl:flex flex-col items-start text-left leading-tight max-w-[150px]">
            <span className="text-[13px] font-semibold text-brand-600 truncate max-w-full">{user.name}</span>
            <span className="text-[10px] truncate max-w-full">{user.institution || '—'}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-tinta" aria-hidden="true" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-60 bg-white border border-linha rounded-xl shadow-card-hover py-2 z-50"
          >
            <div className="px-4 pb-2 mb-1 border-b border-linha">
              <p className="text-sm font-semibold text-brand-600 truncate">{user.name}</p>
              <p className="text-xs truncate">{user.email}</p>
            </div>
            {accountLinks.map((l) => (
              <Link key={l.to} role="menuitem" to={l.to} className="block px-4 py-2 text-sm hover:bg-brand-50 text-tinta">
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 border-t border-linha mt-1"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Fecha o menu do celular ao trocar de pagina
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="bg-white border-b border-linha sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 h-16 lg:h-20 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 rounded-md" aria-label="BBCC — página inicial">
          <img
            src="/bbcc-logo/svg/bbcc-icone.svg"
            alt=""
            aria-hidden="true"
            className="h-10 w-10 lg:h-[46px] lg:w-[46px] shrink-0"
          />
          <span className="flex flex-col gap-[3px]">
            <span className="font-display font-bold text-[22px] lg:text-[26px] leading-none tracking-[0.04em] text-brand-600">
              BBCC
            </span>
            <span className="hidden sm:block text-[11px] leading-none text-tinta">
              Base Brasileira em Ciência da Computação
            </span>
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden lg:flex items-center gap-9">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => navClass({ isActive: isActive || isAlso(link, pathname) })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <AccountMenu />
          ) : (
            <>
              <Link
                to="/entrar"
                className="h-11 px-5 inline-flex items-center rounded-[10px] border border-brand-600 text-brand-600
                           font-semibold text-[15px] hover:bg-brand-50 transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/cadastrar"
                className="h-11 px-5 inline-flex items-center rounded-[10px] bg-verde-600 text-white
                           font-semibold text-[15px] hover:bg-verde-700 transition-colors"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden p-2 -mr-2 rounded-md text-brand-600"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div id="menu-mobile" className="lg:hidden border-t border-linha bg-white px-4 sm:px-6 pb-5">
          <nav aria-label="Principal" className="flex flex-col pt-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `${navClass({ isActive: isActive || isAlso(link, pathname) })} py-3`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          {user ? (
            <div className="mt-3 border-t border-linha pt-3 flex flex-col">
              <p className="text-sm font-semibold text-brand-600">{user.name}</p>
              <p className="text-xs mb-1">{user.email}</p>
              {accountLinks.map((l) => (
                <Link key={l.to} to={l.to} className="py-2.5 text-[15px] text-tinta">
                  {l.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="mt-2 h-11 rounded-[10px] border border-brand-600 text-brand-600 font-semibold text-[15px]"
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                to="/entrar"
                className="h-11 inline-flex items-center justify-center rounded-[10px] border border-brand-600
                           text-brand-600 font-semibold text-[15px]"
              >
                Entrar
              </Link>
              <Link
                to="/cadastrar"
                className="h-11 inline-flex items-center justify-center rounded-[10px] bg-verde-600 text-white
                           font-semibold text-[15px]"
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
