import iconAi from '../assets/icons/area-ai.svg'
import iconCode from '../assets/icons/area-code.svg'
import iconNet from '../assets/icons/area-net.svg'
import iconDb from '../assets/icons/area-db.svg'
import iconShield from '../assets/icons/area-shield.svg'
import iconEdu from '../assets/icons/area-edu.svg'
import iconHci from '../assets/icons/area-hci.svg'
import iconTheory from '../assets/icons/area-theory.svg'

export interface Area {
  slug: string
  label: string
  /** O backend ainda nao classifica artigos por area: cada area e uma busca por este termo. */
  term: string
  icon: string
  /** Assuntos de exemplo do Figma; cada um leva a uma busca. */
  topics: string[]
}

export const AREAS: Area[] = [
  { slug: 'ia', label: 'Inteligência Artificial', term: 'inteligência artificial', icon: iconAi, topics: ['aprendizado de máquina', 'visão computacional', 'PLN'] },
  { slug: 'es', label: 'Engenharia de Software', term: 'engenharia de software', icon: iconCode, topics: ['requisitos', 'testes', 'métricas'] },
  { slug: 'redes', label: 'Redes e Sistemas Distribuídos', term: 'redes', icon: iconNet, topics: ['redes 5G', 'computação em nuvem'] },
  { slug: 'bd', label: 'Banco de Dados', term: 'banco de dados', icon: iconDb, topics: ['dados abertos', 'consultas'] },
  { slug: 'seguranca', label: 'Segurança da Informação', term: 'segurança', icon: iconShield, topics: ['criptografia', 'malware'] },
  { slug: 'educacao', label: 'Informática na Educação', term: 'educação', icon: iconEdu, topics: ['ensino de programação', 'gamificação'] },
  { slug: 'ihc', label: 'Interação Humano-Computador', term: 'interação humano-computador', icon: iconHci, topics: ['usabilidade', 'acessibilidade'] },
  { slug: 'teoria', label: 'Teoria da Computação', term: 'teoria da computação', icon: iconTheory, topics: ['algoritmos', 'complexidade'] },
]

export function searchLink(term: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({ q: term, ...extra })
  return `/artigos?${params.toString()}`
}

/** O backend ainda nao classifica por area: usa a primeira cujo termo aparece no titulo ou nas palavras-chave. */
export function inferArea(article: { title: string; keywords?: string[] }): Area | undefined {
  const text = [article.title, ...(article.keywords ?? [])].join(' ').toLowerCase()
  return AREAS.find((a) => text.includes(a.term.toLowerCase()))
}
