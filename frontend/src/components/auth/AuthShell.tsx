import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

interface AuthShellProps {
  title: string
  text: string
  perks: string[]
  children: ReactNode
}

/**
 * Moldura das telas Entrar e Cadastrar: painel azul com a marca e o formulario ao lado.
 * Os dois lados sao centralizados e crescem em telas grandes (2xl), para que a tela
 * tenha a mesma proporcao do Figma com qualquer zoom ou tamanho de monitor.
 */
export default function AuthShell({ title, text, perks, children }: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[39%_1fr] bg-creme">
      <aside className="bg-brand-600 text-white flex flex-col justify-center px-6 sm:px-12 py-10 lg:py-16">
        <div className="max-w-[420px] 2xl:max-w-[500px] w-full mx-auto">
          <Link to="/" aria-label="BBCC — página inicial" className="inline-block rounded-md">
            <img
              src="/bbcc-logo/svg/animado/bbcc-carregando-claro.svg"
              alt=""
              aria-hidden="true"
              className="w-[84px] h-[84px] lg:w-[100px] lg:h-[100px] 2xl:w-[128px] 2xl:h-[128px]"
            />
          </Link>
          <h1 className="mt-6 lg:mt-8 !text-creme text-[30px] lg:text-[36px] 2xl:text-[46px] font-semibold leading-[1.15] text-balance">
            {title}
          </h1>
          <p className="mt-4 text-tinta-claro text-[15px] 2xl:text-[18px] leading-relaxed">{text}</p>
          <ul className="mt-6 hidden sm:flex flex-col gap-3.5 2xl:gap-4">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-[15px] 2xl:text-[17px] text-tinta-claro">
                <span className="w-5 h-5 2xl:w-6 2xl:h-6 rounded-full bg-verde-600 text-white inline-flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 2xl:w-3.5 2xl:h-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-10 lg:py-16">
        <div className="w-full max-w-[400px] 2xl:max-w-[480px]">{children}</div>
      </main>
    </div>
  )
}
