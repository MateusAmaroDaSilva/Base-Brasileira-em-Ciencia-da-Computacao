import { imageOf } from '../../data/magazineCovers'
import type { Magazine } from '../../types'

// Cores das capas na ordem do guia da marca; as revistas conhecidas mantem a mesma cor em todo o site
const KNOWN: Record<string, number> = { JBCS: 0, RITA: 1, RBIE: 2, JISA: 0 }
const COVERS = [
  { bg: 'bg-brand-600', ink: 'text-creme', accent: 'bg-amarelo-400', dot: 'bg-brand-300' },
  { bg: 'bg-verde-600', ink: 'text-white', accent: 'bg-white/70', dot: 'bg-verde-200' },
  { bg: 'bg-amarelo-400', ink: 'text-brand-600', accent: 'bg-brand-600', dot: 'bg-brand-600/40' },
]

const SIZES = {
  sm: 'w-[56px] h-[76px]',
  md: 'w-[76px] h-[102px]',
}

interface Props {
  magazine?: Magazine
  size?: keyof typeof SIZES
}

/** Capa real da revista quando ha uma; sem ela, uma capa desenhada com a sigla. */
export default function MagazineCover({ magazine, size = 'md' }: Props) {
  const box = SIZES[size]

  if (!magazine) {
    return (
      <div
        className={`${box} shrink-0 rounded-md border border-dashed border-linha bg-creme
                    flex flex-col items-center justify-center gap-1.5 text-[11px] text-tinta/70`}
      >
        <img src="/bbcc-logo/svg/bbcc-icone.svg" alt="" aria-hidden="true" className="w-6 h-6 opacity-70" />
        Sem capa
      </div>
    )
  }

  const image = imageOf(magazine)
  const alt = image?.kind === 'logo' ? `Logo de ${magazine.description ?? magazine.name}` : `Capa de ${magazine.description ?? magazine.name}`
  if (image?.kind === 'cover') {
    return (
      <img
        src={image.src}
        alt={alt}
        loading="lazy"
        className={`${box} shrink-0 rounded-md object-cover object-top border border-linha shadow-card`}
      />
    )
  }
  if (image?.kind === 'logo') {
    // A marca da revista, inteira e centralizada, sobre fundo branco no formato de uma capa
    return (
      <span className={`${box} shrink-0 rounded-md bg-white border border-linha shadow-card flex items-center justify-center p-1.5`}>
        <img src={image.src} alt={alt} loading="lazy" className="w-full max-h-full object-contain" />
      </span>
    )
  }

  const style = COVERS[(KNOWN[magazine.name] ?? magazine.id) % COVERS.length]
  const compact = size === 'sm'
  return (
    <div
      className={`relative ${box} shrink-0 rounded-md overflow-hidden ${compact ? 'p-1.5' : 'p-2'} ${style.bg} ${style.ink}`}
      role="img"
      aria-label={`Capa de ${magazine.description ?? magazine.name}`}
    >
      <p className={`font-display font-bold leading-none tracking-[0.04em] ${compact ? 'text-xs' : 'text-[15px]'}`}>
        {magazine.name.length > 6 ? magazine.name.slice(0, 6) : magazine.name}
      </p>
      <span className={`block h-[2px] mt-1.5 ${compact ? 'w-5' : 'w-7'} ${style.accent}`} aria-hidden="true" />
      {!compact && (
        <p className="mt-1.5 text-[6.5px] leading-[1.25] opacity-90 line-clamp-4">{magazine.description}</p>
      )}
      <span className={`absolute -bottom-3 -right-2 w-9 h-9 rounded-full ${style.dot}`} aria-hidden="true" />
      <span className={`absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full ${style.accent}`} aria-hidden="true" />
    </div>
  )
}
