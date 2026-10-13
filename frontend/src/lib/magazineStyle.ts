import type { Magazine } from '../types'

// Cores das siglas na ordem do guia da marca; as revistas conhecidas mantem a cor em todo o site
const KNOWN: Record<string, number> = { JBCS: 0, RITA: 1, RBIE: 2, JISA: 0 }
const STYLES = ['bg-brand-600 text-creme', 'bg-verde-600 text-white', 'bg-amarelo-400 text-brand-600']

export function siglaClass(magazine: Magazine): string {
  return STYLES[(KNOWN[magazine.name] ?? magazine.id) % STYLES.length]
}

/** O site da revista e o endereco do OAI-PMH sem o final /oai. */
export function magazineSite(magazine: Magazine): string {
  return magazine.url_oai_pmh.replace(/\/oai\/?$/, '')
}
