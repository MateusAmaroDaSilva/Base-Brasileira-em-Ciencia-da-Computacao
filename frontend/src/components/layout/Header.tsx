import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-sm sm:text-base tracking-wide">
              Base Brasileira em Ciência da Computação
            </p>
            <p className="text-slate-400 text-xs hidden sm:block">
              Acervo de artigos científicos nacionais
            </p>
          </div>
        </Link>
      </div>
    </header>
  )
}
