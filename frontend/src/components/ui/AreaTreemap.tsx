import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchLink, type Area } from '../../data/areas'
import { squarify } from '../../lib/treemap'

const NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

// Do azul claro ao azul da marca: quanto mais escuro o bloco, mais artigos a area tem
const LIGHT = [195, 209, 227] // brand-200
const DARK = [22, 50, 92] // brand-600
const mix = (t: number) => `rgb(${LIGHT.map((c, i) => Math.round(c + (DARK[i] - c) * t)).join(',')})`

interface Props {
  areas: Area[]
  totals: Record<string, number | undefined>
}

export default function AreaTreemap({ areas, totals }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Em telas estreitas o quadro fica mais alto, para os blocos terem espaco para o texto
  const height = width < 560 ? Math.max(380, width * 1.05) : Math.max(300, Math.min(420, width * 0.42))
  const max = Math.max(1, ...areas.map((a) => totals[a.slug] ?? 0))
  const hasData = areas.some((a) => (totals[a.slug] ?? 0) > 0)

  const tiles = useMemo(
    () =>
      squarify(
        // Sem dados todos os blocos tem o mesmo tamanho; area vazia mantem um bloco minimo
        areas.map((area) => ({ value: hasData ? Math.max(totals[area.slug] ?? 0, max * 0.02) : 1, data: area })),
        width,
        height,
      ),
    [areas, totals, hasData, max, width, height],
  )

  return (
    <div>
      <div ref={box} className="relative w-full" style={{ height }} role="group" aria-label="Tamanho de cada área, em número de artigos">
        {tiles.map(({ x, y, w, h, data: area }) => {
          const total = totals[area.slug]
          const t = hasData && total ? total / max : 0
          const dark = t > 0.42
          const roomy = w > 120 && h > 64
          const small = w > 60 && h > 34
          return (
            <Link
              key={area.slug}
              to={searchLink(area.term)}
              title={`${area.label}: ${total !== undefined ? NUMBER_FORMAT.format(total) : '—'} artigos`}
              aria-label={`${area.label}: ${total !== undefined ? NUMBER_FORMAT.format(total) : '—'} artigos`}
              className="absolute p-[2px] group"
              style={{ left: x, top: y, width: w, height: h }}
            >
              <span
                className="h-full w-full rounded-lg p-3 flex flex-col justify-between overflow-hidden transition-[filter] group-hover:brightness-95 group-focus-visible:brightness-95"
                style={{ background: hasData ? mix(0.12 + t * 0.88) : '#e1e8f1', color: dark ? '#faf8f3' : '#16325c' }}
              >
                {small && (
                  <span className={`font-semibold leading-tight ${roomy ? 'text-[15px]' : 'text-xs'} line-clamp-3`}>
                    {area.label}
                  </span>
                )}
                {small && (
                  <span className="text-xs tabular-nums opacity-90">
                    {total !== undefined ? NUMBER_FORMAT.format(total) : '—'} {roomy ? 'artigos' : ''}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </div>

      <p className="mt-3 text-xs">
        O tamanho de cada bloco é proporcional ao número de artigos da área; quanto mais escuro, mais artigos. Um artigo
        pode aparecer em mais de uma área.
      </p>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-verde-600 hover:text-verde-700 w-fit">Ver como tabela</summary>
        <table className="mt-3 w-full max-w-[520px] text-left">
          <thead className="text-xs uppercase tracking-wider text-brand-600">
            <tr>
              <th className="py-2 font-semibold">Área</th>
              <th className="py-2 font-semibold text-right">Artigos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {[...areas]
              .sort((a, b) => (totals[b.slug] ?? 0) - (totals[a.slug] ?? 0))
              .map((area) => (
                <tr key={area.slug}>
                  <td className="py-2">{area.label}</td>
                  <td className="py-2 text-right tabular-nums">
                    {totals[area.slug] !== undefined ? NUMBER_FORMAT.format(totals[area.slug]!) : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
