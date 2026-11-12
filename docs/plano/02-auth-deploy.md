# Sessão 02 — Auth + deploy

**Depende de:** 01
**Ler antes:** CLAUDE.md §2 (Auth), §8 (Server Actions), §9

## Objetivo
Login Google restrito à allowlist, protegendo o app inteiro, funcionando em local e no Vercel.

## Entregáveis
- `next-auth@5` (Auth.js) com provider Google, sessão JWT (sem adapter de banco).
- `auth.ts` na raiz: callback `signIn` só aceita e-mail presente em `ALLOWED_EMAILS`.
- `lib/auth/allowlist.ts`: função pura que parseia `ALLOWED_EMAILS` (vírgulas, minúsculas, sem espaços) e checa o e-mail.
- `app/api/auth/[...nextauth]/route.ts`.
- `middleware.ts`: tudo protegido, exceto `/login`, `/api/auth/*` e assets estáticos.
- `lib/auth/require-user.ts`: `requireUser()` que falha sem sessão — chamado no início de **toda** Server Action de mutação daqui pra frente.
- `app/(auth)/login/page.tsx`: marca Giro (roleta de 4 quadrantes Brasa/tinta, centro vazado, ponteiro dourado, em SVG), slogan "Gire. Estude 10 minutos. Domine o tópico.", botão "Entrar com Google". Mensagem amigável se o e-mail for recusado.
- Deploy no Vercel (Hobby): envs configuradas, redirect URIs do Google para `localhost` e para o domínio do Vercel.

## Regras e detalhes
- Nunca expor a allowlist no cliente.
- `AUTH_SECRET` obrigatório.

## Testes
- Allowlist: maiúsculas, espaços, lista vazia → ninguém entra.

## Pronto quando
- Local **e** Vercel: e-mail permitido entra; outro e-mail é recusado com a mensagem; rota protegida sem login redireciona para `/login`.
- lint, test e build limpos.

## Fora do escopo
Layout com navegação (sessão 03).
