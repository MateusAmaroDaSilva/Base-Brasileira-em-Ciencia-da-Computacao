import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-brand-900 text-white sticky top-0 z-40">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center">
        <Link
          to="/"
          className="flex items-center gap-2.5 min-w-0 rounded-md hover:opacity-90 transition-opacity"
        >
          <span className="bg-white/10 rounded-lg p-1.5 shrink-0">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="leading-tight min-w-0">
            <span className="block font-semibold text-sm sm:text-base truncate">
              Base Brasileira em Ciência da Computação
            </span>
            <span className="hidden sm:block text-brand-200 text-xs">
              Artigos de periódicos brasileiros, em um só lugar
            </span>
          </span>
        </Link>
      </div>
    </header>
  )
}
