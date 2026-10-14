import type { Magazine } from '../types'

export interface MagazineImage {
  src: string
  /** cover: capa de uma edicao, preenche o quadro; logo: marca da revista, centralizada sobre fundo branco */
  kind: 'cover' | 'logo'
}

/**
 * Imagens publicas das proprias revistas, reduzidas para a web. A chave e a sigla da revista no banco.
 *
 * - RITA e Ciencia & Inovacao publicam capa de edicao (a mais recente).
 * - RBIE e ISYS nao publicam capa: usa-se o logo oficial de cada uma.
 * - Reviews nao tem capa nem logo proprio (so o logo generico SBC OpenLib, igual para todas as
 *   revistas da SBC): fica com a capa desenhada. Para incluir, ponha o arquivo em public/revistas/
 *   e acrescente a linha abaixo.
 */
const IMAGES: Record<string, MagazineImage> = {
  RITA: { src: '/revistas/rita.jpg', kind: 'cover' },
  'Ciência & Inovação': { src: '/revistas/ciencia-inovacao.jpg', kind: 'cover' },
  RBIE: { src: '/revistas/rbie-logo.jpg', kind: 'logo' },
  ISYS: { src: '/revistas/isys-logo.png', kind: 'logo' },
}

export const imageOf = (magazine?: Pick<Magazine, 'name'>): MagazineImage | undefined =>
  magazine ? IMAGES[magazine.name] : undefined
