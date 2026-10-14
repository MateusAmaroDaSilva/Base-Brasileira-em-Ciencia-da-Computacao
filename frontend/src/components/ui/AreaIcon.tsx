import type { ReactNode } from 'react'

/**
 * Pictogramas das areas, desenhados para o BBCC no estilo do logo: traco na cor do texto
 * (currentColor) e um detalhe verde ou amarelo. 48x48, tracos arredondados.
 */
const STROKE = { stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const
const GREEN = '#1e7f57'
const YELLOW = '#e8b931'

const ICONS: Record<string, ReactNode> = {
  // Chip com as letras IA
  ia: (
    <>
      <rect x="11" y="11" width="26" height="26" rx="5.5" {...STROKE} />
      {[17.5, 24, 30.5].map((p) => (
        <g key={p} {...STROKE}>
          <path d={`M${p} 5.5V11M${p} 37v5.5`} />
          <path d={`M5.5 ${p}H11M37 ${p}h5.5`} />
        </g>
      ))}
      <text x="24" y="29.6" textAnchor="middle" fontSize="15" fontWeight="800" fill={GREEN} fontFamily="Fraunces, Georgia, serif">
        IA
      </text>
    </>
  ),
  // </> com a barra em amarelo
  es: (
    <>
      <path d="M17 14 6.5 24 17 34" {...STROKE} />
      <path d="M31 14 41.5 24 31 34" {...STROKE} />
      <path d="M27.5 10 20.5 38" stroke={YELLOW} strokeWidth="3.4" strokeLinecap="round" fill="none" />
    </>
  ),
  // Rede com um no central, como no logo
  redes: (
    <>
      <g {...STROKE}>
        <path d="M24 24 10 11M24 24l14-13M24 24 10 37M24 24l14 13" />
        <circle cx="9" cy="10" r="4.6" fill="#fff" />
        <circle cx="39" cy="10" r="4.6" fill="#fff" />
        <circle cx="9" cy="38" r="4.6" fill="#fff" />
        <circle cx="39" cy="38" r="4.6" fill="#fff" />
      </g>
      <circle cx="24" cy="24" r="6.4" fill={GREEN} />
    </>
  ),
  // Cilindro de banco de dados com uma faixa verde
  bd: (
    <>
      <ellipse cx="24" cy="11" rx="15" ry="5.5" {...STROKE} />
      <path d="M9 11v26c0 3 6.7 5.5 15 5.5S39 40 39 37V11" {...STROKE} />
      <path d="M9 24c0 3 6.7 5.5 15 5.5S39 27 39 24" stroke={GREEN} strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  // Escudo com visto
  seguranca: (
    <>
      <path d="M24 5 39 10.5V23c0 10-6.6 17-15 20-8.4-3-15-10-15-20V10.5Z" {...STROKE} />
      <path d="m16.5 24 5.2 5.4L32 18.5" stroke={GREEN} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  // Capelo de formatura com borla amarela
  educacao: (
    <>
      <path d="M24 9 4.5 18.5 24 28l19.5-9.5Z" {...STROKE} />
      <path d="M13 23.5V32c0 3.3 5 6 11 6s11-2.7 11-6v-8.5" {...STROKE} />
      <path d="M43.5 18.500V30" stroke={YELLOW} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="43.5" cy="33" r="2.8" fill={YELLOW} />
    </>
  ),
  // Janela com cursor
  ihc: (
    <>
      <rect x="5" y="8" width="34" height="26" rx="4" {...STROKE} />
      <path d="M5 16.500h34" {...STROKE} />
      <circle cx="10.5" cy="12.3" r="1.3" fill="currentColor" />
      <circle cx="15" cy="12.3" r="1.3" fill="currentColor" />
      <path d="M28 25 28 42.5 32.5 38.3 36 45.5 39.8 43.8 36.4 36.7 42.5 36Z" fill={GREEN} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),
  // Fita de uma maquina de Turing, com o cabecote em amarelo
  teoria: (
    <>
      {[3.5, 17.5, 31.5].map((x) => (
        <rect key={x} x={x} y="23" width="13" height="15" rx="2.6" {...STROKE} strokeWidth={2.4} />
      ))}
      <g fontFamily="ui-monospace, Menlo, monospace" fontSize="11.5" fontWeight="800" textAnchor="middle">
        <text x="10" y="33.6" fill="currentColor">0</text>
        <text x="24" y="33.6" fill={GREEN}>1</text>
        <text x="38" y="33.6" fill="currentColor">0</text>
      </g>
      <path d="M24 19.500 18 10.500h12Z" fill={YELLOW} />
      <path d="M24 10.500V5" {...STROKE} strokeWidth={2.6} />
    </>
  ),
}

export default function AreaIcon({ slug, className = 'w-8 h-8' }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      {ICONS[slug] ?? <circle cx="24" cy="24" r="14" {...STROKE} />}
    </svg>
  )
}
