# Sessão 13 — Caderno de erros

**Depende de:** 09, 11
**Ler antes:** CLAUDE.md §4.6

## Objetivo
Lista das questões cuja **última** resposta foi errada, com filtro e opção de refazer.

## Entregáveis
- Query: última resposta por questão (`DISTINCT ON (questao_id) … ORDER BY questao_id, respondida_em DESC`) com `acertou = false`, só questões ativas.
- `/erros`: filtro por disciplina e tópico (search params); lista com enunciado, tópico, data do erro, resposta dada × gabarito. Procedimentos (sessão 11) entram quando a última tentativa não passou: mostram o nome, "% lembrado" e os passos esquecidos daquela tentativa (`respostas_passos`).
- "Refazer" (todas as filtradas ou uma) → sessão `modo='erros'` com `Questao` ou `Procedimento` e feedback imediato. Acertou → sai da lista naturalmente.
- Ligar o botão "Revisar N erros" do resultado (09) para `/erros` filtrado pelo tópico da sessão.
- Acesso pela tela Revisão ("Caderno de erros").

## Testes
- Se a seleção da última resposta virar função pura, testar: errou e depois acertou → não aparece; acertou e depois errou → aparece.

## Pronto quando
- Errar uma questão numa rodada, vê-la em `/erros`, refazer acertando e ela sumir da lista — conferido no banco.
- lint, test e build limpos.

## Fora do escopo
Simulado (17).
