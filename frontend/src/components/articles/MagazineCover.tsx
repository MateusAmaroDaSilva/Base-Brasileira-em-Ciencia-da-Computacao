import type { Magazine } from '../../types'

// Cores das capas na ordem do guia da marca; as revistas conhecidas mantem a mesma cor em todo o site
const KNOWN: Record<string, number> = { JBCS: 0, RITA: 1, RBIE: 2, JISA: 0 }
const COVERS = [
  { bg: 'bg-brand-600', ink: 'text-creme', accent: 'bg-amarelo-400', dot: 'bg-brand-300' },
  { bg: 'bg-verde-600', ink: 'text-white', accent: 'bg-white/70', dot: 'bg-verde-200' },
  { bg: 'bg-amarelo-400', ink: 'text-brand-600', accent: 'bg-brand-600', dot: 'bg-brand-600/40' },
]

export default function MagazineCover({ magazine }: { magazine?: Magazine }) {
  if (!magazine) {
    return (
      <div
        className="w-[76px] h-[102px] shrink-0 rounded-md border border-dashed border-linha bg-creme
                   flex flex-col items-center justify-center gap-1.5 text-[11px] text-tinta/70"
      >
        <img src="/bbcc-logo/svg/bbcc-icone.svg" alt="" aria-hidden="true" className="w-6 h-6 opacity-70" />
        Sem capa
      </div>
    )
  }

  const style = COVERS[(KNOWN[magazine.name] ?? magazine.id) % COVERS.length]
  return (
    <div
      className={`relative w-[76px] h-[102px] shrink-0 rounded-md overflow-hidden p-2 ${style.bg} ${style.ink}`}
      role="img"
      aria-label={`Capa de ${magazine.description ?? magazine.name}`}
    >
      <p className="font-display font-bold text-[15px] leading-none tracking-[0.04em]">{magazine.name}</p>
      <span className={`block h-[2px] w-7 mt-1.5 ${style.accent}`} aria-hidden="true" />
      <p className="mt-1.5 text-[6.5px] leading-[1.25] opacity-90 line-clamp-4">{magazine.description}</p>
      <span className={`absolute -bottom-3 -right-2 w-9 h-9 rounded-full ${style.dot}`} aria-hidden="true" />
      <span className={`absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full ${style.accent}`} aria-hidden="true" />
    </div>
  )
}
