import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import ListToolbar from '../components/ui/ListToolbar'
import { useMagazines } from '../hooks/useMagazines'
import { useMagazineStats } from '../hooks/useMagazineStats'
import { magazineSite, siglaClass } from '../lib/magazineStyle'
import type { Magazine } from '../types'
import iconArrow from '../assets/icons/arrow-right.svg'

const NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

const CHIPS = [
  { value: 'todas', label: 'Todas' },
  { value: 'aberto', label: 'Acesso aberto' },
  { value: 'doi', label: 'Com DOI' },
  { value: 'ativas', label: 'Em atividade' },
]

const SORTS = [
  { value: 'nome', label: 'Ordenar por nome' },
  { value: 'artigos', label: 'Ordenar por artigos' },
]

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display font-bold text-[22px] leading-tight text-brand-600 tabular-nums">{value}</span>
      <span className="text-[11px]">{label}</span>
    </div>
  )
}

export default function RevistasPage() {
  const { magazines } = useMagazines()
  const stats = useMagazineStats(magazines)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('nome')
  const [chip, setChip] = useState('todas')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return magazines
      .filter((m) => !q || `${m.name} ${m.description ?? ''}`.toLowerCase().includes(q))
      .filter((m) => {
        // Todas as revistas vem de repositorios OAI-PMH abertos; o backend nao guarda a licenca por revista
        if (chip === 'doi') return (stats[m.id]?.withDoi ?? 0) > 0
        if (chip === 'ativas') return m.is_active
        return true
      })
      .sort((a, b) =>
        sort === 'artigos'
          ? (stats[b.id]?.total ?? 0) - (stats[a.id]?.total ?? 0)
          : (a.description ?? a.name).localeCompare(b.description ?? b.name, 'pt-BR'),
      )
  }, [magazines, stats, query, sort, chip])

  // Sem dados da API os blocos continuam na tela, com "—" (fidelidade ao Figma)
  const cards: (Magazine | null)[] = magazines.length === 0 ? [null, null, null] : visible

  return (
    <main className="flex-1 bg-creme">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-10 pb-14 lg:pt-14 lg:pb-20">
        <h1 className="text-[34px] lg:text-[44px] font-semibold text-brand-600">Revistas indexadas</h1>
        <p className="mt-3 max-w-[440px] text-base">
          As revistas científicas brasileiras de computação que fazem parte da base. Clique em uma delas para ver
          todos os seus artigos.
        </p>

        <ListToolbar
          query={query}
          onQuery={setQuery}
          placeholder="Buscar revista por nome ou ISSN"
          sort={sort}
          onSort={setSort}
          sortOptions={SORTS}
          chips={CHIPS}
          chip={chip}
          onChip={setChip}
        />

        {cards.length === 0 ? (
          <p className="mt-10 text-center">Nenhuma revista encontrada para esse filtro.</p>
        ) : (
          <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((m, i) => {
              const s = m ? stats[m.id] : undefined
              return (
                <li key={m?.id ?? `vazio-${i}`} className="bg-white border border-linha rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <span
                      className={`w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-center font-display font-bold
                                  tracking-[0.04em] leading-tight px-1 ${(m?.name.length ?? 1) > 5 ? 'text-[11px]' : 'text-base'} ${
                                    m ? siglaClass(m) : 'bg-brand-100 text-brand-600'
                                  }`}
                    >
                      {m?.name ?? '—'}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold leading-snug text-brand-600 break-anywhere">
                        {m ? (m.description ?? m.name) : '—'}
                      </h2>
                      {/* O backend ainda nao guarda ISSN */}
                      <p className="text-xs mt-0.5">ISSN —</p>
                    </div>
                  </div>

                  {/* O backend ainda nao classifica as revistas por area */}
                  <div className="flex flex-wrap gap-2">
                    <span className="h-6 px-2.5 inline-flex items-center rounded-full bg-brand-100 text-brand-600 text-[11px] font-semibold">
                      —
                    </span>
                  </div>

                  <div className="border-t border-linha pt-4 grid grid-cols-3 gap-3">
                    <Stat value={s ? NUMBER_FORMAT.format(s.total) : '—'} label="artigos" />
                    <Stat value="—" label="edições" />
                    <Stat value={s?.since ? String(s.since) : '—'} label="desde" />
                  </div>

                  <div className="border-t border-linha pt-4 flex items-center justify-between gap-3 text-[13px] font-semibold">
                    {m ? (
                      <Link
                        to={`/artigos?magazine=${m.id}`}
                        className="inline-flex items-center gap-1.5 text-verde-600 hover:text-verde-700"
                      >
                        Ver artigos
                        <img src={iconArrow} alt="" aria-hidden="true" className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-verde-600">Ver artigos</span>
                    )}
                    {m && (
                      <a
                        href={magazineSite(m)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium hover:text-brand-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        Site da revista
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <section
          id="falta-revista"
          className="mt-12 bg-white border border-linha rounded-[20px] px-6 py-8 sm:px-12 sm:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          aria-labelledby="falta-titulo"
        >
          <div className="max-w-[720px]">
            <h2 id="falta-titulo" className="text-[26px] font-semibold text-brand-600">
              Falta alguma revista aqui?
            </h2>
            <p className="mt-2 text-sm">
              Se você conhece uma revista brasileira de computação que ainda não está na base, indique para a equipe
              avaliar.
            </p>
          </div>
          <Link
            to="/sobre#indicar"
            className="h-12 px-8 rounded-[10px] bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[15px]
                       inline-flex items-center justify-center transition-colors shrink-0"
          >
            Indicar revista
          </Link>
        </section>
      </div>
    </main>
  )
}
