# Sessão 08 — Componente de questão + pontuação

**Depende de:** 05
**Ler antes:** CLAUDE.md §4.3 (passos 3–4), §4.4, §8 (teclado) · design: "Questão", "Acerto", "Erro", "Acessibilidade"

## Objetivo
Um componente de questão reutilizado por roleta, revisão, erros e simulado, com a regra de pontuação.

## Entregáveis
- `lib/domain/pontuacao.ts`: `pontosQuestao({ acertou, tempoMs, sequenciaAtual })` = 10 + `round(max(0, 5 × (1 − s/60)))`, ×1,5 a partir do 3º acerto seguido, erro = 0. `resumoSessao(respostas)` → total, acertos, maior sequência.
- `lib/domain/selecao-questoes.ts`: ordena candidatas por (1) revisão vencida, (2) nunca respondida, (3) mais erradas; corta em N. `embaralharAlternativas(alternativas, rng)` reetiqueta A–E na exibição e guarda o mapa para a letra original.
- `components/quiz/Questao.tsx` com prop `feedback: 'imediato' | 'final'`:
  - Cabeçalho: chip da disciplina, tipo; enunciado (caso clínico 18 px / 1,6; 19 px no notebook; 16 px no celular).
  - Alternativas: `role="radiogroup"`, linhas de 56 px (50 no celular) com letra em quadrado de 34 px; estados normal, selecionada, correta, sua resposta, esmaecida. Distinguir por cor **e** ícone **e** texto ("Correta", "Sua resposta").
  - Teclado: A–E escolhem, Enter confirma / avança; dica escondida em telas de toque (`@media (hover: none)`).
  - "Confirmar resposta" e "Não sei — mostrar resposta" (conta como erro).
  - Feedback imediato em `role="status"`: acerto em Menta, "Isso!", "+N XP" e selo de sequência; erro em âmbar, "Quase! A correta é a X." — **nunca vermelho, sem tremida**. Explicação + fonte. "Sinalizar erro" (marca `sinalizada_com_erro`).
  - Animações do design (acerto 900 ms; erro 200 + 150 ms); em movimento reduzido, só cor e opacidade, números trocam direto.
- `components/quiz/BarraProgresso.tsx`: "Questão 3 de 5", 5 segmentos coloridos pelo resultado, sequência e pontos.
- Server Action `responder({ questaoId, sessaoId, respostaDada, tempoMs })`: `requireUser()`, confere o gabarito **no servidor**, limita `tempoMs` (0–30 min), grava em `respostas`, devolve `{ acertou, gabarito, explicacao, fonte }`. (FSRS entra na sessão 10.)
- Página de teste `/dev/questao` com uma questão do seed (apagar na 17).

## Regras e detalhes
- O gabarito não vai para o cliente antes da resposta.
- Layout: iPad paisagem enunciado + painel 420; notebook painel 480 e largura máx. 1312; retrato e celular em uma coluna, explicação abaixo das alternativas.

## Testes
- Pontuação: 0 s (+5), 60 s ou mais (+0), 3º acerto seguido ×1,5, sequência quebrada zera, erro = 0.
- Seleção: prioridade correta e corte em N.
- Embaralhar: o mapa de letras volta para a original.

## Pronto quando
- Em `/dev/questao`, responder certo e errado, por mouse e teclado; conferir a linha em `respostas`.
- lint, test e build limpos.
- Não verificado automaticamente: toque real no iPad.

## Fora do escopo
Fluxo da sessão (09), FSRS (10).
