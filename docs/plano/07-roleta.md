# Sessão 07 — Roleta

**Depende de:** 05
**Ler antes:** CLAUDE.md §4.2 · design: "Roleta (o coração do app)", "Animação e movimento reduzido"

## Objetivo
A roleta: filtros, sorteio no servidor e animação até parar na fatia sorteada.

## Entregáveis
- `lib/domain/roleta.ts` (puro):
  - `pesoTopico({ dominio, nuncaEstudado, estudadoUltimas24h, temProvaEm14Dias })` = `1 + (100 - dominio) / 25`, ×1,5 nunca estudado, ×2 prova em 14 dias, ×0,5 estudado nas últimas 24 h. (`temProvaEm14Dias` chega sempre `false` até a sessão 16.)
  - `sortear(itens, rng = Math.random)` ponderado.
  - `motivoPeso()` para o "Por que ele?" (ex.: "domínio baixo", "nunca estudado").
  - `fatiaSobPonteiro(angulo, fatias)` (usada no visor e nos tics).
- Server Action `girar({ modo: 'inteligente' | 'sorte', disciplinaIds, topicoIds })` com Zod + `requireUser()`: só tópicos com ≥ 1 questão ativa, de disciplinas não arquivadas; lista vazia → motivo legível. Retorna `{ fatias: [{ topicoId, nome, disciplina, cor, peso }], sorteadoId, motivo }`. Em "sorte", pesos iguais.
- A página já carrega as fatias (sem sorteio) para a roleta aparecer antes de girar.
- `components/roleta/`:
  - Roda em SVG ou `conic-gradient`; ângulo ∝ peso; fatia em tinta clara com nome em texto escuro; aro externo na cor cheia agrupando disciplinas.
  - Visor acima com o tópico sob o ponteiro (`aria-live="polite"`).
  - Giro com Framer Motion: antecipação −8°, ~4,6 s com ease `[.15, .75, .18, 1]`, overshoot de 2° voltando em mola; tic no ponteiro a cada fronteira (−18° e volta, stiffness 700, damping 18). O ângulo final cai **dentro** da fatia sorteada (posição aleatória dentro dela).
  - Parada: outras fatias a 40%, centro pulsa 1 → 1,08 → 1, 16 confetes, card do sorteado sobe com mola: tópico, disciplina, domínio, "Por que ele?", "Começar estudo · 10 min", "Girar de novo", NotebookLM.
  - Movimento reduzido: `useReducedMotion()` **ou** o interruptor do painel → sem giro; fatias acendem em 6 passos de 80 ms, resultado com fade de 200 ms, sem confete. O interruptor fica em `localStorage` (com try/catch).
- Painel: segmentado Inteligente / Sorte pura, chips de disciplina com contagem (desligado = tracejado), interruptor de movimento reduzido, botão "Girar a roleta" (o centro da roleta também gira). "Girando…" desativado durante a animação.
- Estados: antes, girando (nomes borrados, ponteiro inclinado), sorteado, vazia (círculo tracejado + "Criar questões" → `/disciplinas`).
- Layout: notebook roleta 580 + painel 400; iPad paisagem 500 + 340; retrato 540 em cima e filtros em 2 colunas; celular 300 sem nomes nas fatias (só visor) e filtros ocultos.
- "Começar estudo" leva a uma rota placeholder (a sessão 09 liga).

## Regras e detalhes
- O cliente **não** sorteia; só anima até o resultado do servidor.
- Som do tic: opcional. Se fizer, Web Audio de 30 ms, máx. 20 tics/s, só depois de interação.

## Testes
- Pesos: novo (domínio 0, ×1,5), estudado < 24 h, domínio 100, combinação de fatores.
- `sortear` com rng fixo cai no item esperado; sorte pura com pesos iguais.
- `fatiaSobPonteiro` nas bordas (0°, 360°, fronteira exata).

## Pronto quando
- Girar no navegador para em fatia coerente com o sorteado do servidor (conferir em ~10 giros).
- Filtros e estado vazio funcionam; movimento reduzido troca a animação.
- lint, test e build limpos.
- Não verificado automaticamente: sensação da animação, fluidez e tics no iPad real.

## Fora do escopo
Sessão de estudo (09), peso de provas (16).
