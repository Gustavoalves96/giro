# Sessão 01 — Banco

**Depende de:** 00
**Ler antes:** CLAUDE.md §3, §9

## Objetivo
Schema completo no Neon com Drizzle, de uma vez, e dados de exemplo para as próximas sessões.

## Entregáveis
- Dependências: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `zod`, `tsx` (dev).
- `lib/db/schema.ts`: **todas** as tabelas e enums do CLAUDE.md §3 (`disciplinas, topicos, questoes, respostas, revisoes, sessoes, provas, explicacoes_ia`) **mais**:
  - `perfil`: `id int pk default 1`, `nome text null`, `atualizado_em timestamptz` (linha única).
- `lib/db/index.ts` com `drizzle-orm/neon-http` e `DATABASE_URL`.
- `drizzle.config.ts`; scripts `db:generate`, `db:migrate`, `db:seed` no package.json.
- `.env.example` com as variáveis do CLAUDE.md §9; `.env.local` no `.gitignore`.
- Índices: `questoes(topico_id)`, `respostas(questao_id, respondida_em)`, `revisoes(due)`, `topicos(disciplina_id)`.
- FKs com `onDelete: 'cascade'` de tópico → questões → respostas / revisões / explicações.
- `scripts/seed.ts`: as 6 disciplinas do design com as cores cheias, 3–5 tópicos cada, ~5 questões por tópico (misturando os 3 tipos). Idempotente. Comentário no topo: conteúdo fictício, validar com ela.
- Atualizar o CLAUDE.md §3 com a tabela `perfil`.

## Regras e detalhes
- Datas `timestamptz` em UTC; `defaultNow()` nos `criado_em`.
- Tipos inferidos (`$inferSelect` / `$inferInsert`) exportados para o resto do app. Sem `any`.

## Testes
- Nenhum novo (sem lógica).

## Pronto quando
- `db:generate` + `db:migrate` aplicados no Neon.
- `db:seed` rodado e contagem de linhas por tabela conferida por query.
- lint, test e build limpos.

## Fora do escopo
Telas, auth, Server Actions.
