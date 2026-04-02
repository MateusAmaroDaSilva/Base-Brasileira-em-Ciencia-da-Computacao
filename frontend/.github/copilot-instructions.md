<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Frontend - Base Brasileira em Ciência da Computação

## Project Setup Checklist

- [x] Verificar copilot-instructions.md
- [x] Scaffold do projeto React + Vite
- [x] Customizar componentes e integração com API
- [x] Instalar extensões se necessário
- [x] Compilar e resolver erros
- [x] Criar task de desenvolvimento
- [x] Atualizar documentação final

## Project Overview

React 18 + TypeScript + Vite + Tailwind CSS front-end para integração com API FastAPI backend.

## Quick Commands

```bash
npm install       # Instalar dependências
npm run dev       # Iniciar servidor de desenvolvimento (porta 3000)
npm run build     # Build para produção
npm run preview   # Preview da build
```

## Architecture

- **React 18**: Framework de UI components
- **Vite**: Build tool otimizado para desenvolvimento rápido
- **TypeScript**: Type safety completo
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client para API calls

## Key Features Implemented

✅ Listagem de revistas e artigos  
✅ Busca em tempo real de artigos  
✅ Filtro por revista  
✅ UI responsiva com Tailwind  
✅ Tratamento de erros e loading states  
✅ Proxy automático para API backend  

## Components

- **App.tsx**: Componente principal com state management
- **SearchBar.tsx**: Componente de busca com debounce
- **MagazineSelector.tsx**: Seletor de revistas
- **ArticleList.tsx**: Lista com formatação de artigos

## API Integration

- Proxy automático em `vite.config.ts` para `http://localhost:8000`
- Endpoints utilizados:
  - `GET /api/v1/magazines` - Lista revistas
  - `GET /api/v1/articles` - Lista artigos com filtros
  - `GET /api/v1/articles?q=query` - Busca
  - `GET /api/v1/articles?magazine_id=X` - Por revista

## Development Workflow

1. Execute `npm run dev` para iniciar servidor local
2. Acesse `http://localhost:3000`
3. Faça mudanças nos componentes (hot reload automático via Vite)
4. Commits e pushes de features

## Build & Deploy

```bash
npm run build    # Cria dist/ com assets otimizados
npm run preview  # Testa build localmente
```

Output em `dist/` pronto para deployment em produção.

## Troubleshooting

**Erro na conexão com API**: Verifique se backend está rodando em porta 8000  
**Porta 3000 ocupada**: Mude em `vite.config.ts` → `server.port`  
**Dependências antigas**: Execute `npm update` ou `npm audit fix`

---

Setup completo e pronto para testes com o backend! 🚀
