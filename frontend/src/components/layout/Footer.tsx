export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <p>© {new Date().getFullYear()} Base Brasileira em Ciência da Computação</p>
        <p className="text-slate-500">Iniciação Científica · Dados via protocolo OAI-PMH</p>
      </div>
    </footer>
  )
}
