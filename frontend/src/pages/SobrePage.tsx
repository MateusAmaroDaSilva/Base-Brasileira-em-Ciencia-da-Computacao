import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, ChevronDown, Code2, Database, Download, Mail, User } from 'lucide-react'
import { searchArticles } from '../api/articles'
import { useMagazines } from '../hooks/useMagazines'
import { downloadCsv } from '../lib/csv'
import { doiText } from '../lib/citation'
import { NO_FILTERS } from '../lib/searchDefaults'

const NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

// Dados que o Figma deixa em branco: preencher aqui quando a equipe confirmar
const CONTACT_EMAIL = ''
const TEAM = [
  { name: '', role: 'Orientação', detail: '' },
  { name: '', role: 'Pesquisa e desenvolvimento', detail: '' },
  { name: '', role: 'Colaboração', detail: '' },
]

const STEPS = [
  {
    title: 'Coleta',
    text: 'Os registros são buscados nos sistemas das próprias revistas, de forma automática e periódica.',
  },
  {
    title: 'Padronização',
    text: 'Título, autores, resumo, palavras-chave, revista, ano e DOI são organizados num formato único para todas as revistas.',
  },
  {
    title: 'Busca',
    text: 'Tudo fica disponível numa busca só, com filtros por área, ano, revista e tipo de publicação.',
  },
]

const CRITERIA = [
  'Ser uma revista científica brasileira que publica na área de computação',
  'Ter avaliação por pares descrita publicamente',
  'Disponibilizar os metadados dos artigos de forma acessível',
  'Estar em atividade ou ter acervo completo disponível',
  'Identificar os artigos com DOI ou link permanente',
]

const FAQ = [
  {
    q: 'A BBCC publica artigos?',
    a: 'Não. A base reúne os registros e encaminha para a revista, que continua sendo a responsável pela publicação.',
  },
  {
    q: 'O acesso é gratuito?',
    a: 'Sim. A busca e a leitura dos registros são gratuitas; o texto completo fica no site de cada revista, conforme a política dela.',
  },
  {
    q: 'Preciso de conta para usar?',
    a: 'Não para pesquisar. A conta serve para guardar o histórico de buscas, salvar artigos e receber alertas.',
  },
  {
    q: 'Com que frequência a base é atualizada?',
    a: 'Todos os dias, de madrugada: a coleta nas revistas roda automaticamente.',
  },
  {
    q: 'Como citar a base em um trabalho?',
    a: 'BBCC — Base Brasileira em Ciência da Computação. Universidade de Marília (UNIMAR), 2026. Disponível em: ' +
      (typeof window !== 'undefined' ? window.location.origin : '') +
      '.',
  },
]

function Section({ id, title, intro, children }: { id?: string; title: string; intro?: string; children: ReactNode }) {
  const headingId = `titulo-${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`
  return (
    <section id={id} className="pt-14 lg:pt-20 scroll-mt-20" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-[28px] lg:text-[34px] font-semibold text-brand-600">
        {title}
      </h2>
      {intro && <p className="mt-1 text-sm max-w-[420px]">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

const card = 'bg-white border border-linha rounded-2xl'
const outlineButton =
  'h-9 px-4 rounded-lg bg-white border border-linha inline-flex items-center gap-2 text-[13px] font-semibold text-brand-600 ' +
  'hover:border-brand-300 transition-colors'

export default function SobrePage() {
  const { hash } = useLocation()
  const { magazines } = useMagazines()
  const [total, setTotal] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    searchArticles({ query: '', searchType: 'simple', filters: NO_FILTERS, page: 1, limit: 1 })
      .then((res) => setTotal(res.total))
      .catch(() => null)
  }, [])

  // As ancoras do rodape (#equipe, #metodologia...) e da home (#indicar, #criterios)
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  const lastSync = magazines
    .map((m) => m.last_sync)
    .filter((d): d is string => !!d)
    .sort()
    .pop()

  const numbers = [
    { value: total !== null ? NUMBER_FORMAT.format(total) : '—', label: 'artigos' },
    { value: magazines.length > 0 ? String(magazines.length) : '—', label: 'revistas' },
    // O backend ainda nao fornece autores nem instituicoes distintos
    { value: '—', label: 'autores' },
    { value: '—', label: 'instituições' },
  ]

  // Baixa o acervo inteiro em CSV, em paginas para nao sobrecarregar a API
  async function downloadData() {
    setExporting(true)
    try {
      const rows: (string | number | null | undefined)[][] = [
        ['Título', 'Autores', 'Revista', 'Data', 'DOI', 'URL', 'Palavras-chave'],
      ]
      const byId = new Map(magazines.map((m) => [m.id, m.name]))
      const size = 500
      for (let page = 1; ; page++) {
        const res = await searchArticles({ query: '', searchType: 'simple', filters: NO_FILTERS, page, limit: size })
        for (const a of res.articles) {
          rows.push([
            a.title,
            (a.authors ?? []).join('; '),
            byId.get(a.magazine_id),
            a.publication_date?.slice(0, 10),
            doiText(a.doi),
            a.url,
            (a.keywords ?? []).join('; '),
          ])
        }
        if (page * size >= res.total || res.articles.length === 0) break
      }
      downloadCsv('bbcc-dados-abertos.csv', rows)
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="flex-1 bg-creme">
      {/* Abertura */}
      <section className="bg-brand-600 text-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-12 lg:py-16 flex items-center justify-between gap-10">
          <div className="max-w-[820px]">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-amarelo-400">
              Projeto de Iniciação Científica · UNIMAR
            </p>
            <h1 className="mt-3 text-[38px] lg:text-[52px] font-semibold text-white leading-tight">Sobre o projeto</h1>
            <p className="mt-4 text-base lg:text-lg text-tinta-claro">
              A BBCC reúne, num só lugar, artigos e revistas científicas brasileiras da área de computação. O objetivo
              é simples: quem pesquisa não deveria precisar visitar dezenas de sites diferentes para encontrar o que
              foi publicado no país.
            </p>
          </div>
          <div className="hidden md:flex w-[180px] shrink-0 justify-center" aria-hidden="true">
            <img src="/bbcc-logo/svg/animado/bbcc-carregando-claro.svg" alt="" className="w-[170px] h-[170px]" />
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pb-14 lg:pb-20">
        {/* O que e a base */}
        <Section title="O que é a base">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10 items-start">
            <div className="flex flex-col gap-4 text-base leading-[1.7] max-w-[620px]">
              <p>
                Hoje, a produção científica em computação está espalhada por muitas revistas, cada uma com seu próprio
                site e seu próprio sistema de busca. Encontrar tudo o que já foi publicado sobre um assunto exige
                repetir a mesma busca em vários lugares.
              </p>
              <p>
                A BBCC recolhe esses registros, organiza num formato único e oferece uma busca só. Cada artigo mantém
                o vínculo com a revista de origem, e o texto completo continua sendo lido no site dela. A base não
                substitui as revistas: ela ajuda as pessoas a chegarem até elas.
              </p>
            </div>
            <aside className={`${card} p-6`} aria-labelledby="numeros">
              <h3 id="numeros" className="text-lg font-semibold text-brand-600">A base em números</h3>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                {numbers.map((n) => (
                  <div key={n.label} className="flex flex-col">
                    <dd className="order-1 font-display font-bold text-[36px] leading-tight text-brand-600 tabular-nums">
                      {n.value}
                    </dd>
                    <dt className="order-2 text-xs">{n.label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[11px]">
                Atualizado em{' '}
                {lastSync ? new Date(lastSync).toLocaleDateString('pt-BR') : '—'}.
              </p>
            </aside>
          </div>
        </Section>

        {/* Como funciona */}
        <Section title="Como funciona" intro="Da revista até a sua busca, em três etapas.">
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className={`${card} p-6 flex flex-col gap-3`}>
                <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-semibold text-sm inline-flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold text-brand-600">{step.title}</h3>
                <p className="text-sm leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Criterios */}
        <Section id="criterios" title="Critérios de indexação" intro="O que uma revista precisa ter para entrar na base.">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-stretch">
            <ul className={`${card} p-6 sm:p-8 flex flex-col gap-4`}>
              {CRITERIA.map((c) => (
                <li key={c} className="flex items-start gap-3 text-[15px]">
                  <span className="w-5 h-5 rounded-full bg-verde-50 text-verde-600 inline-flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <aside id="indicar" className="bg-amarelo-100 border border-amarelo-200 rounded-2xl p-6 scroll-mt-24 flex flex-col gap-3 items-start">
              <h3 className="text-lg font-semibold text-brand-600">Indique uma revista</h3>
              <p className="text-sm leading-relaxed text-[#6b5200]">
                A lista cresce com a ajuda da comunidade. Se você conhece uma revista que se encaixa nos critérios,
                envie para a equipe avaliar.
              </p>
              {CONTACT_EMAIL ? (
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Indicação de revista`}
                  className="h-10 px-5 rounded-[10px] bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center transition-colors"
                >
                  Indicar revista
                </a>
              ) : (
                <span className="h-10 px-5 rounded-[10px] bg-brand-600 text-white text-sm font-semibold inline-flex items-center opacity-70" title="E-mail de contato ainda não definido">
                  Indicar revista
                </span>
              )}
            </aside>
          </div>
        </Section>

        {/* Quem faz */}
        <Section id="equipe" title="Quem faz" intro="O projeto é desenvolvido na Universidade de Marília (UNIMAR).">
          <ul className="grid gap-6 md:grid-cols-3">
            {TEAM.map((person) => (
              <li key={person.role} className={`${card} p-6 flex flex-col gap-1`}>
                <span className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 inline-flex items-center justify-center mb-2">
                  <User className="w-5 h-5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold text-brand-600">{person.name || '[Nome]'}</h3>
                <p className="text-xs font-semibold text-verde-600">{person.role}</p>
                <p className="mt-2 text-[13px]">{person.detail || '[Descrição]'}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Metodologia e dados abertos */}
        <Section id="metodologia" title="Metodologia e dados abertos" intro="Como o trabalho é feito e como reusar os dados.">
          <ul className="grid gap-6 md:grid-cols-3">
            <li className={`${card} p-6 flex flex-col gap-3 items-start`}>
              <span className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 inline-flex items-center justify-center">
                <Download className="w-[18px] h-[18px]" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-brand-600">Metodologia</h3>
              <p className="text-sm leading-relaxed">
                Documento com as fontes consultadas, os critérios de seleção e os passos de padronização dos
                registros.
              </p>
              <button type="button" disabled className={`${outlineButton} mt-auto opacity-60 cursor-not-allowed`} title="Documento ainda não publicado">
                Baixar documento
              </button>
            </li>
            <li className={`${card} p-6 flex flex-col gap-3 items-start`}>
              <span className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 inline-flex items-center justify-center">
                <Database className="w-[18px] h-[18px]" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-brand-600">Dados abertos</h3>
              <p className="text-sm leading-relaxed">
                Os metadados reunidos podem ser baixados em formato aberto para uso em outras pesquisas.
              </p>
              <button type="button" onClick={downloadData} disabled={exporting || !total} className={`${outlineButton} mt-auto disabled:opacity-60`}>
                {exporting ? 'Preparando…' : 'Baixar dados'}
              </button>
            </li>
            <li className={`${card} p-6 flex flex-col gap-3 items-start`}>
              <span className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 inline-flex items-center justify-center">
                <Code2 className="w-[18px] h-[18px]" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-brand-600">API pública</h3>
              <p className="text-sm leading-relaxed">
                Uma interface para consultar a base a partir de outros sistemas e aplicações.
              </p>
              <button type="button" disabled className={`${outlineButton} mt-auto opacity-60 cursor-not-allowed`} title="Documentação ainda não publicada">
                Ver documentação
              </button>
            </li>
          </ul>
        </Section>

        {/* Perguntas frequentes */}
        <Section title="Perguntas frequentes">
          <div className={`${card} divide-y divide-linha overflow-hidden`}>
            {FAQ.map((item, i) => (
              <details key={item.q} open={i === 0} className="group">
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none text-[15px] font-semibold text-brand-600 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="px-6 pb-4 text-sm leading-relaxed -mt-1">{item.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* Contato */}
        <section id="contato" className="pt-14 lg:pt-20 scroll-mt-20" aria-labelledby="contato-titulo">
          <div className="bg-brand-600 text-white rounded-2xl px-6 py-8 sm:px-12 sm:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-[560px]">
              <h2 id="contato-titulo" className="text-[28px] font-semibold text-white">Fale com a equipe</h2>
              <p className="mt-2 text-sm text-tinta-claro">
                Dúvidas, correções em algum registro ou interesse em colaborar com o projeto.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {CONTACT_EMAIL ? (
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="h-11 px-5 rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <span className="h-11 px-5 rounded-[10px] bg-verde-600 text-white text-sm font-semibold inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  [e-mail de contato]
                </span>
              )}
              <Link
                to="/sobre#indicar"
                className="h-11 px-5 rounded-[10px] border border-white/60 text-white text-sm font-semibold inline-flex items-center hover:bg-white/10 transition-colors"
              >
                Indicar revista
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
