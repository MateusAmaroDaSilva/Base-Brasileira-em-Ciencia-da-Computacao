import { Link } from 'react-router-dom'

// Provisorio: telas do Figma ainda nao implementadas
export default function ComingSoon({ title }: { title: string }) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3">Esta página está em construção.</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-verde-600 hover:text-verde-700">
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
