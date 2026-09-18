# Identidade visual e interface

Referência de como a marca BBCC é aplicada na interface web.

## Paleta

| Nome | Hex | Onde aparece |
|---|---|---|
| Azul-marinho | `#16325C` | cor principal: cabeçalho, rodapé, títulos, botões de ação |
| Verde | `#1E7F57` | destaque: selo da revista em cada resultado |
| Amarelo | `#E8B931` | detalhe, reservado ao logo |
| Creme | `#FAF8F3` | fundo das páginas |
| Cinza-texto | `#4A4A4A` | corpo de texto sobre fundo claro |
| Azul-acinzentado claro | `#D5DDEA` | texto sobre fundo escuro |

No Tailwind, o azul é a escala `brand` (o tom `600` é o `#16325C`), e o verde, o amarelo,
o creme e os cinzas têm nomes próprios. Ver `frontend/tailwind.config.js`.

## Tipografia

As duas fontes vêm do próprio logo, ambas gratuitas no Google Fonts:

- **Fraunces** — títulos (`font-display`, aplicada a `h1`, `h2` e `h3`)
- **IBM Plex Sans** — corpo de texto e interface

## Arquivos da marca

Ficam em `frontend/public/bbcc-logo/`, com um `README.md` próprio explicando cada versão.
Onde cada uma é usada:

| Arquivo | Uso |
|---|---|
| `svg/bbcc-horizontal-claro.svg` | cabeçalho (fundo azul) |
| `svg/bbcc-vertical.svg` | abertura da página de busca |
| `svg/bbcc-icone.svg` | cartões das revistas |
| `svg/bbcc-icone-claro.svg` | rodapé |
| `svg/animado/bbcc-carregando-texto.svg` | tela inicial, enquanto a aplicação carrega |
| `svg/animado/bbcc-carregando.svg` | durante uma busca e ao abrir um artigo |
| `favicon/` | ícones do navegador e da tela inicial do celular |

As animações param sozinhas para quem ativou "reduzir movimento" no sistema operacional.

## Regras de interface

**Responsivo primeiro.** A versão de celular não é uma redução da de computador:

- os filtros aparecem como barra lateral fixa a partir de `lg`; abaixo disso viram uma
  gaveta que sobe pela base da tela, aberta pelo botão "Filtros";
- o botão de buscar ocupa a largura toda no celular;
- o campo de busca usa fonte de 16px em telas pequenas, o que impede o zoom automático
  do iOS ao tocar no campo;
- a paginação mostra "Página X de Y" no celular e os números apenas em telas maiores;
- títulos, autores e palavras-chave usam `break-anywhere`, para que termos compridos,
  DOIs e URLs não estourem a coluna.

**Hierarquia do resultado.** Cada cartão traz, nesta ordem: revista, ano, título (até três
linhas), autores, trecho do resumo, palavras-chave e uma ação explícita "Ver detalhes".
No celular são exibidas menos palavras-chave, para o cartão não virar um bloco de texto.

**Filtros aplicados ficam visíveis** como etiquetas acima da lista, cada uma removível,
mais um "Limpar tudo". Sem isso o usuário perde de vista por que o número de resultados caiu.

**Acessibilidade.** Foco visível em toda a interface, navegação por teclado nos cartões,
rótulos em todos os botões de ícone e estados anunciados durante o carregamento.

## Idiomas

Os periódicos informam o idioma ora com duas letras (`pt`), ora com três (`por`). O mapa
em `frontend/src/components/filters/MetadataSidebar.tsx` cobre as duas formas; sem isso o
filtro mostra o código cru em vez do nome do idioma.
