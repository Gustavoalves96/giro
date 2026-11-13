# Sessão 15 — Estatísticas

**Depende de:** 09 (usa `lib/domain/stats.ts` da sessão 14 se já existir; senão, cria)
**Ler antes:** CLAUDE.md §4.7 · design: "Estatísticas"

## Objetivo
Página de evolução: o ranking é contra ela mesma.

## Entregáveis
- Quatro números: XP total, maior sequência de dias (e a atual), % de acertos no período (início → fim), questões respondidas.
- Segmentado de período (8 semanas / ano).
- Evolução semanal: barras de questões respondidas + linha de % de acertos + minutos estudados.
- Ranking de tópicos do pior ao melhor domínio (barra na cor da disciplina, link para o tópico).
- Top 10 sessões por pontuação (data, tópico, pontos).
- "Passos que você mais esquece": até 10 passos de procedimentos com mais "esqueci"/"com erro" em `respostas_passos` (procedimento, passo, quantas vezes), some se não houver procedimentos praticados.
- Mapa de calor do ano.
- Gráficos em SVG feito à mão (sem biblioteca), cada um com `<title>` / descrição em texto; cores dos tokens, funcionando nos 2 temas.
- `agregarPorSemana` em `lib/domain/stats.ts`.

## Testes
- `agregarPorSemana`: semana começando na segunda, fuso SP, semana sem dados aparece zerada.

## Pronto quando
- Os números batem com queries manuais no banco; gráficos legíveis nas 4 larguras e nos 2 temas.
- lint, test e build limpos.

## Fora do escopo
Exportação de dados.
