# Vispro — Frontend (shadcn/ui)

Versão do frontend do Vistoria Pro construída **somente com componentes do shadcn/ui**.
Mantém a arquitetura, as cores e as fontes do projeto original (`vispro.frontend`).

Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (New York) + lucide-react.

## Arquitetura

Organização por **feature**, cada uma com suas camadas:

```
src/
├─ components/ui/        # componentes do shadcn (gerados pela CLI, não editar à mão)
├─ hooks/                # hooks gerados pela CLI do shadcn (use-mobile)
├─ features/
│  ├─ auth/
│  │  ├─ domain/         # tipos do domínio (Usuario, ContaAutenticada, PerfilUsuario)
│  │  ├─ application/    # casos de uso (autenticar, cadastrar)
│  │  ├─ infrastructure/ # chamadas de API / Keycloak
│  │  └─ presentation/   # telas (LoginPage, SignupPage)
│  └─ empresas/
│     ├─ domain/         # Empresa, Solicitacao, FuncionarioEmpresa
│     ├─ infrastructure/ # empresas-api
│     └─ presentation/   # CreateCompany, AddEmployees, Funcionarios, AddFuncionario
└─ shared/
   ├─ infrastructure/    # http-client, token-storage
   └─ presentation/
      ├─ hooks/          # useTheme (claro/escuro)
      ├─ layouts/        # AppShell, Sidebar, Topbar
      └─ lib/            # helpers de apresentação (iniciais/gradiente do avatar)
```

## Estilo

Todos os tokens ficam em [src/index.css](src/index.css), mapeando a paleta original
(teal `#0D9488`, superfícies quentes `#FAFAF7`/`#F5F5F2`, texto `#1B1B17`) para os tokens
do shadcn (`--primary`, `--background`, `--card`, `--sidebar`, ...).

- Tema escuro pela classe `dark` no `<html>` (`useTheme`), como manda o shadcn.
- Fontes: **Plus Jakarta Sans** (sans), **Instrument Serif** (títulos), **JetBrains Mono** (keys),
  carregadas pelo Google Fonts em [index.html](index.html).
- Raios e sombras do design original redefinidos em `@theme inline`.
- Só duas utilities próprias: `onboarding-bg` (fundo decorativo das telas de onboarding)
  e `brand-mark` (marca "V" com gradiente teal).

## Componentes

Nenhum componente de UI próprio: tudo vem do shadcn (`npx shadcn@latest add <componente>`).
Já instalados: `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `card`,
`checkbox`, `dropdown-menu`, `input`, `label`, `progress`, `separator`, `sheet`, `sidebar`,
`skeleton`, `table`, `tooltip`.

Os arquivos em `src/components/ui` e `src/hooks/use-mobile.ts` são gerados pela CLI e ficam
fora do ESLint (veja [eslint.config.js](eslint.config.js)) para poderem ser atualizados sem atrito.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173 (proxy /api -> localhost:5000, /keycloak -> keycloak.4fdevelopers.com.br)
npm run build
npm run lint
npm run preview
```

A documentação da API usada pelo front está em [API.md](API.md).
