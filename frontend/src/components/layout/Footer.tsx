import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const columns = [
  {
    title: 'Navegar',
    links: [
      { to: '/', label: 'Artigos' },
      { to: '/revistas', label: 'Revistas' },
      { to: '/areas', label: 'Áreas' },
      { to: '/artigos', label: 'Autores' },
    ],
  },
  {
    title: 'Projeto',
    links: [
      { to: '/sobre', label: 'Sobre' },
      { to: '/sobre#equipe', label: 'Equipe' },
      { to: '/sobre#metodologia', label: 'Metodologia' },
      { to: '/sobre#contato', label: 'Contato' },
    ],
  },
  {
    title: 'Para revistas',
    links: [
      { to: '/sobre#indicar', label: 'Indicar revista' },
      { to: '/sobre#criterios', label: 'Critérios de indexação' },
      { to: '/sobre#dados-abertos', label: 'Dados abertos' },
    ],
  },
]

const accountColumn = {
  title: 'Minha conta',
  links: [
    { to: '/conta/historico', label: 'Histórico de buscas' },
    { to: '/conta/salvos', label: 'Artigos salvos' },
    { to: '/conta/alertas', label: 'Alertas' },
    { to: '/conta/perfil', label: 'Meu perfil' },
  ],
}

export default function Footer() {
  const { user } = useAuth()
  // Logado, o rodape troca Projeto e Para revistas por Minha conta
  const shown = user ? [columns[0], accountColumn] : columns
  return (
    <footer className="bg-brand-600 text-tinta-claro mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-12 lg:pt-14 pb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-10">
          <div className="max-w-[380px]">
            <div className="flex items-center gap-3">
              <img
                src="/bbcc-logo/svg/bbcc-icone-claro.svg"
                alt=""
                aria-hidden="true"
                className="h-[52px] w-[52px] shrink-0"
              />
              <p className="font-display font-bold text-[30px] tracking-[0.04em] text-creme">BBCC</p>
            </div>
            <p className="mt-4 text-[15px] leading-[1.6]">
              Base Brasileira em Ciência da Computação. Projeto de Iniciação Científica da
              Universidade de Marília (UNIMAR).
            </p>
          </div>

          <div className={`grid grid-cols-2 ${user ? '' : 'sm:grid-cols-3'} gap-x-10 gap-y-8 lg:gap-x-24`}>
            {shown.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="!font-sans !text-amarelo-400 font-semibold text-[13px] uppercase tracking-[0.08em]">
                  {col.title}
                </h2>
                <ul className="mt-3 space-y-3 text-[15px]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} className="hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-creme/20 flex flex-col sm:flex-row sm:justify-between gap-2 text-[13px]">
          <p>© {new Date().getFullYear()} BBCC · Base Brasileira em Ciência da Computação</p>
          <p>Iniciação Científica · UNIMAR</p>
        </div>
      </div>
    </footer>
  )
}
