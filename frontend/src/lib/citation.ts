import type { Article, Magazine } from '../types'

export type CitationFormat = 'abnt' | 'apa' | 'bibtex'

/** O DOI pode vir como link completo ou so como 10.xxxx/yyyy, conforme a revista. */
export function doiUrl(doi?: string | null): string | undefined {
  if (!doi) return undefined
  return /^https?:\/\//i.test(doi) ? doi : `https://doi.org/${doi}`
}

export function doiText(doi?: string | null): string | undefined {
  return doi ? doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : undefined
}

function yearOf(article: Article): number | undefined {
  if (!article.publication_date) return undefined
  const year = new Date(article.publication_date).getFullYear()
  return isNaN(year) ? undefined : year
}

// Os autores chegam como "Sobrenome, Nome"
function splitName(author: string): { family: string; given: string } {
  const [family, ...rest] = author.split(',')
  return { family: family.trim(), given: rest.join(',').trim() }
}

function initials(given: string): string {
  return given
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => `${n[0].toUpperCase()}.`)
    .join(' ')
}

const ascii = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

function abnt(article: Article, magazine?: Magazine): string {
  const authors = (article.authors ?? []).map((a) => {
    const { family, given } = splitName(a)
    return given ? `${family.toUpperCase()}, ${given}` : family.toUpperCase()
  })
  const year = yearOf(article)
  const doi = doiText(article.doi)
  const link = doi ? `DOI: ${doi}.` : article.url ? `Disponível em: ${article.url}.` : ''
  return [
    authors.length > 0 ? `${authors.join('; ')}.` : '',
    `${article.title}.`,
    magazine ? `${magazine.description ?? magazine.name}${year ? `, ${year}` : ''}.` : '',
    link,
  ]
    .filter(Boolean)
    .join(' ')
}

function apa(article: Article, magazine?: Magazine): string {
  const names = (article.authors ?? []).map((a) => {
    const { family, given } = splitName(a)
    return given ? `${family}, ${initials(given)}` : family
  })
  const authors =
    names.length > 1 ? `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}` : (names[0] ?? '')
  const year = yearOf(article)
  const link = doiUrl(article.doi) ?? article.url
  return [
    authors ? `${authors}` : '',
    `(${year ?? 's.d.'}).`,
    `${article.title}.`,
    magazine ? `${magazine.description ?? magazine.name}.` : '',
    link ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

function bibtex(article: Article, magazine?: Magazine): string {
  const year = yearOf(article)
  const first = splitName((article.authors ?? [])[0] ?? '').family
  const word = ascii(article.title).match(/[A-Za-z]{4,}/)?.[0] ?? 'artigo'
  const key = ascii(`${first || 'bbcc'}${year ?? ''}${word}`).replace(/[^A-Za-z0-9]/g, '').toLowerCase()
  const fields: [string, string | undefined][] = [
    ['author', (article.authors ?? []).join(' and ') || undefined],
    ['title', article.title],
    ['journal', magazine ? (magazine.description ?? magazine.name) : undefined],
    ['year', year ? String(year) : undefined],
    ['doi', doiText(article.doi)],
    ['url', article.url],
  ]
  const body = fields
    .filter((f): f is [string, string] => !!f[1])
    .map(([k, v]) => `  ${k} = {${v}}`)
    .join(',\n')
  return `@article{${key},\n${body}\n}`
}

export function buildReference(format: CitationFormat, article: Article, magazine?: Magazine): string {
  if (format === 'apa') return apa(article, magazine)
  if (format === 'bibtex') return bibtex(article, magazine)
  return abnt(article, magazine)
}

// Referencia ABNT, usada pelo botao de citar dos cartoes
export function buildCitation(article: Article, magazine?: Magazine): string {
  return abnt(article, magazine)
}
