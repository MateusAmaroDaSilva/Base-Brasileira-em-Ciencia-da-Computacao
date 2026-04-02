# Base Brasileira em Ciência da Computação - Frontend

Frontend React + Vite + Tailwind CSS para a plataforma Base Brasileira em Ciência da Computação.

## 🚀 Quick Start

### Prerequisitos
- Node.js 16+ 
- npm ou yarn

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

A aplicação será aberta em `http://localhost:3000` e fará proxy das requisições para a API em `http://localhost:8000`.

### Build para Produção

```bash
npm run build
```

### Preview da Build

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── SearchBar.tsx   # Barra de busca
│   ├── MagazineSelector.tsx  # Seletor de revistas
│   └── ArticleList.tsx  # Lista de artigos
├── App.tsx             # Componente principal
├── main.tsx            # Punto de entrada
└── index.css           # Estilos com Tailwind

vite.config.ts          # Configuração do Vite
tailwind.config.js      # Configuração do Tailwind
postcss.config.js       # Configuração do PostCSS
tsconfig.json           # Configuração do TypeScript
```

## 🎨 Tecnologias

- **React 18** - Framework de UI
- **Vite** - Build tool rápido
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **PostCSS** - CSS processing

## 🔌 Integração com API

O frontend faz proxy automático para a API backend em `http://localhost:8000`:

- `GET /api/v1/magazines` - Lista de revistas
- `GET /api/v1/articles` - Lista de artigos com filtros
- `GET /api/v1/articles?q=query` - Busca de artigos
- `GET /api/v1/articles?magazine_id=1` - Artigos por revista

## 📝 Features

✅ Listagem de revistas  
✅ Seleção de revista com filtro  
✅ Busca de artigos em tempo real  
✅ Exibição de metadados (título, autores, data)  
✅ UI responsiva e moderna  
✅ Tratamento de erros  
✅ Loading states  

## 🐛 Troubleshooting

### Erro "Cannot GET /api/v1/..."
Verifique se o backend está rodando em `http://localhost:8000`:
```bash
curl http://localhost:8000/docs
```

### Portas ocupadas
Se a porta 3000 estiver em uso, você pode mudar em `vite.config.ts`:
```ts
server: {
  port: 3001, // ou outra porta
}
```

## 📄 Licença

Parte do projeto IC 2026 - Base Brasileira em Ciência da Computação
