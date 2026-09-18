import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-brand-600 sticky top-0 z-40">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center">
        <Link to="/" className="flex items-center rounded-md" aria-label="BBCC — página inicial">
          {/* Versao clara do logo, para fundo escuro */}
          <img
            src="/bbcc-logo/svg/bbcc-horizontal-claro.svg"
            alt="BBCC — Base Brasileira em Ciência da Computação"
            className="h-10 sm:h-12 w-auto"
          />
        </Link>
      </div>
    </header>
  )
}
