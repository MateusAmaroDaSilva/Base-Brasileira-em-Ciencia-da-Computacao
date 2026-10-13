import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ListToolbar from '../components/ui/ListToolbar'
import AreaTreemap from '../components/ui/AreaTreemap'
import { AREAS, searchLink } from '../data/areas'
import { useAreaStats } from '../hooks/useAreaStats'
import iconArrow from '../assets/icons/arrow-right.svg'

const NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

const CHIPS = [
  { value: 'todas', label: 'Todas as áreas' },
  { value: 'mais', label: 'Com mais artigos' },
  { value: 'crescimento', label: 'Em crescimento' },
]

const SORTS = [
  { value: 'nome', label: 'Ordenar por nome' },
  { value: 'artigos', label: 'Ordenar por artigos' },
]

export default function AreasPage() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('nome')
  const [chip, setChip] = useState('todas')
  // "Em crescimento" compara os ultimos 3 anos: so pede esses numeros quando o filtro e usado
  const [wantRecent, setWantRecent] = useState(false)
  const stats = useAreaStats(wantRecent)

  function handleChip(value: string) {
    setChip(value)
    if (value === 'crescimento') setWantRecent(true)
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = AREAS.filter((a) => !q || `${a.label} ${a.topics.join(' ')}`.toLowerCase().includes(q))
    const by = (key: 'total' | 'recent') => (a: (typeof AREAS)[number], b: (typeof AREAS)[number]) =>
      (stats[b.slug]?.[key] ?? 0) - (stats[a.slug]?.[key] ?? 0)
    if (chip === 'mais') return [...list].sort(by('total'))
    if (chip === 'crescimento') return [...list].sort(by('recent'))
    if (sort === 'artigos') return [...list].sort(by('total'))
    return [...list].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  }, [query, sort, chip, stats])

  return (
    <main className="flex-1 bg-creme">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-10 pb-14 lg:pt-14 lg:pb-20">
        <h1 className="text-[34px] lg:text-[44px] font-semibold text-brand-600">Áreas da computação</h1>
        <p className="mt-3 max-w-[420px] text-base">
          Os artigos da base são organizados por área de pesquisa. Escolha uma área para ver tudo o que foi publicado
          nela.
        </p>

        <ListToolbar
          query={query}
          onQuery={setQuery}
          placeholder="Buscar área"
          sort={sort}
          onSort={setSort}
          sortOptions={SORTS}
          chips={CHIPS}
          chip={chip}
          onChip={handleChip}
        />

        {visible.length === 0 ? (
          <p className="mt-10 text-center">Nenhuma área encontrada para essa busca.</p>
        ) : (
          <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((area) => {
              const s = stats[area.slug]
              return (
                <li key={area.slug} className="bg-white border border-linha rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <span className="w-12 h-12 rounded-xl bg-[#e6ebf3] flex items-center justify-center shrink-0">
                      <img src={area.icon} alt="" aria-hidden="true" className="w-[22px] h-[22px]" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold leading-snug text-brand-600">{area.label}</h2>
                      <p className="text-xs mt-0.5 tabular-nums">
                        {s ? NUMBER_FORMAT.format(s.total) : '—'} artigos · {s ? s.magazines : '—'} revistas
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {area.topics.map((topic) => (
                      <Link
                        key={topic}
                        to={searchLink(topic)}
                        className="h-6 px-2.5 inline-flex items-center rounded-full bg-brand-100 text-brand-600 text-[11px]
                                   font-semibold hover:bg-brand-200 transition-colors"
                      >
                        {topic}
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-linha pt-4">
                    <Link
                      to={searchLink(area.term)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-verde-600 hover:text-verde-700"
                    >
                      Ver artigos da área
                      <img src={iconArrow} alt="" aria-hidden="true" className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <section className="mt-14" aria-labelledby="panorama">
          <h2 id="panorama" className="text-[28px] lg:text-[34px] font-semibold text-brand-600">Panorama da base</h2>
          <p className="mt-1 text-sm">Quantos artigos cada área reúne hoje.</p>
          <div className="mt-5 bg-white border border-linha rounded-2xl p-4 sm:p-6">
            <AreaTreemap areas={AREAS} totals={Object.fromEntries(AREAS.map((a) => [a.slug, stats[a.slug]?.total]))} />
          </div>
        </section>
      </div>
    </main>
  )
}
