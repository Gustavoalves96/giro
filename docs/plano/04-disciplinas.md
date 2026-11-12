# Sessão 04 — Disciplinas

**Depende de:** 03
**Ler antes:** CLAUDE.md §3 (disciplinas), §8 · design: "Cores das disciplinas"

## Objetivo
CRUD de disciplinas com cor e link do NotebookLM.

## Entregáveis
- `/disciplinas`: lista ordenada por `ordem` com ponto de cor, nome, nº de tópicos, domínio médio (média de `topicos.dominio`) e botão "NotebookLM" (nova aba) quando houver link.
- Criar / editar (Dialog no iPad e notebook, Sheet no celular): nome, cor, link do NotebookLM (URL válida, opcional).
- Seletor de cor: as 6 cores do design + entrada de cor livre (hex).
- Arquivar / desarquivar (arquivadas ficam numa seção recolhida e não entram na roleta).
- Reordenar com botões subir / descer (sem drag).
- `app/(app)/disciplinas/actions.ts`: Server Actions com Zod + `requireUser()` + `revalidatePath`.
- `lib/cores.ts`: `tintaClara(cor)` → `color-mix(in srgb, ${cor} 20%, white)`.

## Regras e detalhes
- Fatias e fundos usam a tinta clara com texto `#15141F`; aro, pontos e gráficos usam a cor cheia.

## Testes
- Schema da disciplina: hex inválido, URL inválida, nome vazio.

## Pronto quando
- Criar, editar, reordenar e arquivar refletem no banco (conferido por query) e na tela.
- Testado nas 4 larguras e nos 2 temas.
- lint, test e build limpos.

## Fora do escopo
Página de detalhe da disciplina (sessão 05).
