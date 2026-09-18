# Logo BBCC — Base Brasileira em Ciência da Computação

## Cores

| Nome            | Hex       | Uso                          |
|-----------------|-----------|------------------------------|
| Azul-marinho    | `#16325C` | Cor principal                |
| Verde           | `#1E7F57` | Destaque                     |
| Amarelo         | `#E8B931` | Detalhe (livro e nó do topo) |
| Creme           | `#FAF8F3` | Fundo claro / versão clara   |

Fontes: **Fraunces Bold** (BBCC) e **IBM Plex Sans** (subtítulo), ambas gratuitas no Google Fonts.
Nos SVGs o texto já está convertido em curvas, então não é preciso instalar as fontes.

## Qual arquivo usar

- **Versão normal** (`bbcc-*.svg`): para fundos claros (branco, creme, cinza-claro).
- **Versão clara** (`bbcc-*-claro.svg`): para fundos escuros (preto, azul-marinho).
- **Mono** (`bbcc-icone-mono-*.svg`): uma cor só, com os livros vazados. Bom para impressão, carimbos e marca d'água.
- **Horizontal**: cabeçalho de site, rodapé, assinatura de e-mail.
- **Vertical**: capas, slides, cartazes.
- **Ícone**: avatar, botão, espaços pequenos.
- **Animado** (`svg/animado/`): tela de carregamento. As animações param sozinhas para quem ativou "reduzir movimento" no sistema.

Abra `preview.html` no navegador para ver todas as versões lado a lado, sobre fundo branco e preto.

## Uso em código

### HTML
```html
<img src="svg/bbcc-horizontal.svg" alt="BBCC — Base Brasileira em Ciência da Computação" height="48">
```

### Troca automática entre tema claro e escuro
```html
<picture>
  <source srcset="svg/bbcc-horizontal-claro.svg" media="(prefers-color-scheme: dark)">
  <img src="svg/bbcc-horizontal.svg" alt="BBCC" height="48">
</picture>
```

### Tela de carregamento
```html
<div id="loading" style="position:fixed;inset:0;display:grid;place-items:center;background:#FAF8F3">
  <img src="svg/animado/bbcc-carregando-texto.svg" alt="Carregando…" width="200">
</div>
<script>
  window.addEventListener('load', () => document.getElementById('loading').remove());
</script>
```
Importante: use `<img>` ou `<object>` para os SVGs animados (a animação é CSS dentro do próprio arquivo).
Como `background-image` também funciona na maioria dos navegadores.

### React / Next.js / Vue
```jsx
import logo from './assets/bbcc-horizontal.svg';

export function Header() {
  return <img src={logo} alt="BBCC" height={48} />;
}
```

### Favicon
Copie a pasta `favicon/` para a raiz do site e coloque no `<head>`:
```html
<link rel="icon" href="/favicon/favicon.ico" sizes="any">
<link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png">
```

## PNGs

- `png/transparente/`: fundo transparente, em dois tamanhos cada.
- `png/fundo-branco/` e `png/fundo-preto/`: com o fundo já aplicado. Inclui `bbcc-avatar-*` quadrado para redes sociais.

Dica: em tamanhos muito pequenos (abaixo de ~32 px) a estante dentro do círculo fica difícil de ler.
Prefira o ícone a partir de 40 px ou a versão horizontal com o nome.
