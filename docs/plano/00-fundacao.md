# Sessão 00 — Fundação

**Depende de:** —
**Ler antes:** CLAUDE.md §2, §7, §8, §10 · design: "Identidade visual", "Componentes e navegação", "Mapa para o código"

## Objetivo
Projeto Next.js de pé com o visual do Giro (tokens, fontes, tema claro/escuro, botões) e Vitest funcionando.

## Entregáveis
- `create-next-app` no diretório atual: TypeScript estrito, App Router, ESLint, Tailwind (v4), **sem** `src/` (seguir a estrutura do CLAUDE.md §7).
- `npx shadcn init` + componentes `button` e `badge`.
- `next-themes` com `ThemeProvider` (classe `.dark`).
- `app/globals.css`: tokens do design em `:root` e `.dark` — `bg, sf, sf2, ink, ink2, ink3, line, ac, acink, ok, warn, gold` — expostos no `@theme` (ex.: `bg-sf`, `text-ink2`, `bg-ac`). Mapear as variáveis do shadcn (`--background`, `--primary`…) para esses tokens.
- Fontes via `next/font/google`: Bricolage Grotesque (400–800, títulos/números, `tracking-[-0.02em]`) e Atkinson Hyperlegible (400/700, corpo). Classes `font-display` e `font-sans`.
- Variantes do Button: `destaque` (Brasa, h-[60px], rounded-[18px], texto 20 px negrito), `default` (tinta), `secondary` (superfície com borda), `ghost`. Chip (pílula 36 px) como variante do Badge.
- Página temporária `app/dev/tokens/page.tsx`: todas as cores, as duas fontes, botões e chips, com botão de alternar tema. (Apagar na sessão 19.)
- Vitest: `vitest.config.ts`, script `"test": "vitest run"`, um teste trivial.
- Atualizar o CLAUDE.md: nome do produto = **Giro**; anotar que o Tailwind é v4 (tokens via `@theme`).

## Regras e detalhes
- Texto sobre Brasa: branco no claro, `#1B0C08` no escuro, só em ≥ 19 px negrito.
- Erro nunca usa vermelho (o token `warn` é âmbar).
- `<html lang="pt-BR">`, metadata com título "Giro".

## Testes
- Só o teste trivial (prova que o Vitest roda).

## Pronto quando
- `/dev/tokens` abre no dev server, CSS e fontes carregam (status e tamanho conferidos), alternar o tema muda todas as cores.
- lint, test e build limpos.

## Fora do escopo
Banco, auth, navegação, qualquer tela real.
