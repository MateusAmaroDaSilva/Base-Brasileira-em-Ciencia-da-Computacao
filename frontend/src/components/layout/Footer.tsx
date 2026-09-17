export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-200 mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row
                      sm:items-center sm:justify-between gap-1.5 text-xs sm:text-sm">
        <p>© {new Date().getFullYear()} Base Brasileira em Ciência da Computação</p>
        <p className="text-brand-300/80">
          Projeto de Iniciação Científica · Unimar · Metadados coletados via OAI-PMH
        </p>
      </div>
    </footer>
  )
}
