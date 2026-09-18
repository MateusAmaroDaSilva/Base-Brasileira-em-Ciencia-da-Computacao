export default function Footer() {
  return (
    <footer className="bg-brand-600 text-tinta-claro mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col sm:flex-row
                      sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/bbcc-logo/svg/bbcc-icone-claro.svg"
            alt=""
            aria-hidden="true"
            className="h-9 w-9 shrink-0"
          />
          <p className="text-xs sm:text-sm">
            © {new Date().getFullYear()} Base Brasileira em Ciência da Computação
          </p>
        </div>

        <p className="text-xs sm:text-sm text-brand-200">
          Projeto de Iniciação Científica · Unimar · Metadados coletados via OAI-PMH
        </p>
      </div>
    </footer>
  )
}
