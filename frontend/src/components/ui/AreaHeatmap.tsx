import { Link } from 'react-router-dom'
import AreaIcon from './AreaIcon'
import { searchLink, type Area } from '../../data/areas'
import type { AreaStats } from '../../hooks/useAreaStats'
import type { Magazine } from '../../types'

const NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

// Do azul claro ao azul da marca: quanto mais escuro, mais artigos
const LIGHT = [225, 232, 241] // brand-100
const DARK = [22, 50, 92] // brand-600
const shade = (t: number) => `rgb(${LIGHT.map((c, i) => Math.round(c + (DARK[i] - c) * t)).join(',')})`

/** Sigla curta para o cabecalho da coluna: nomes longos viram as iniciais ("Ciência & Inovação" -> "C&I"). */
function shortName(name: string): string {
  if (name.length <= 9) return name
  const words = name.split(/\s+/).filter((w) => w !== '&')
  return words.length > 1 ? words.map((w) => w[0].toUpperCase()).join('&') : name.slice(0, 9) + '…'
}

interface Props {
  areas: Area[]
  magazines: Magazine[]
  stats: Record<string, AreaStats | undefined>
}

/**
 * Matriz area x revista: cada celula traz quantos artigos da revista tratam da area.
 * A escala de cor usa a raiz do valor, para que numeros pequenos ao lado de um muito grande
 * ainda aparecam (o numero tambem esta escrito em toda celula).
 */
export default function AreaHeatmap({ areas, magazines, stats }: Props) {
  const total = (slug: string) => stats[slug]?.total ?? 0
  const cell = (slug: string, magazineId: number) => stats[slug]?.byMagazine[magazineId] ?? 0

  // Linhas e colunas ordenadas do maior para o menor total
  const rows = [...areas].sort((a, b) => total(b.slug) - total(a.slug))
  const columns = [...magazines].sort(
    (a, b) => areas.reduce((s, x) => s + cell(x.slug, b.id), 0) - areas.reduce((s, x) => s + cell(x.slug, a.id), 0),
  )
  const max = Math.max(1, ...rows.flatMap((a) => columns.map((m) => cell(a.slug, m.id))))
  const loaded = Object.keys(stats).length > 0

  return (
    <div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[620px] border-separate [border-spacing:5px]">
          <caption className="sr-only">Quantidade de artigos por área e por revista</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left text-[11px] font-semibold uppercase tracking-wider text-tinta pb-1 pr-3">
                Área
              </th>
              {columns.map((m) => (
                <th
                  key={m.id}
                  scope="col"
                  title={m.description ?? m.name}
                  className="text-center text-xs font-bold text-brand-600 pb-1 min-w-[64px]"
                >
                  {shortName(m.name)}
                </th>
              ))}
              <th scope="col" className="text-right text-[11px] font-semibold uppercase tracking-wider text-tinta pb-1 pl-2">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((area) => (
              <tr key={area.slug}>
                <th scope="row" className="text-left pr-3 font-normal">
                  <span className="flex items-center gap-2.5 whitespace-nowrap text-[14px] font-semibold text-brand-600">
                    <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <AreaIcon slug={area.slug} className="w-6 h-6" />
                    </span>
                    {area.label}
                  </span>
                </th>
                {columns.map((m) => {
                  const n = cell(area.slug, m.id)
                  const t = n > 0 ? 0.14 + 0.86 * Math.sqrt(n / max) : 0
                  const label = `${area.label} em ${m.description ?? m.name}: ${NUMBER_FORMAT.format(n)} ${n === 1 ? 'artigo' : 'artigos'}`
                  return (
                    <td key={m.id} className="p-0">
                      <Link
                        to={searchLink(area.term, { magazine: String(m.id) })}
                        title={label}
                        aria-label={label}
                        className="h-11 rounded-lg flex items-center justify-center text-[13px] font-bold tabular-nums
                                   hover:ring-2 hover:ring-verde-600 transition-shadow"
                        style={{
                          background: n > 0 ? shade(t) : '#f2f5f9',
                          color: n === 0 ? '#9aa6b8' : t > 0.5 ? '#faf8f3' : '#16325c',
                        }}
                      >
                        {n > 0 ? NUMBER_FORMAT.format(n) : loaded ? '–' : '—'}
                      </Link>
                    </td>
                  )
                })}
                <td className="text-right pl-2 font-display font-bold text-[18px] text-brand-600 tabular-nums">
                  {loaded ? NUMBER_FORMAT.format(total(area.slug)) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs">
        Cada quadrado mostra quantos artigos da revista tratam da área; quanto mais escuro, mais artigos. Clique para ver
        a lista. Um artigo pode aparecer em mais de uma área.
      </p>
    </div>
  )
}
