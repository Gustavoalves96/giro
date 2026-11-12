# Sessão 14 — Provas

**Depende de:** 07
**Ler antes:** CLAUDE.md §3 (provas), §4.2, §4.6 · design: "Próxima prova" no Início

## Objetivo
Calendário de provas que influencia a roleta e aparece no Início.

## Entregáveis
- `/provas`: lista (próximas primeiro, passadas recolhidas) com contagem regressiva ("em 6 dias", "amanhã", "hoje"); criar / editar / excluir: disciplina, título, data, tópicos (checkboxes dos tópicos da disciplina).
- Server Actions com Zod + `requireUser()`.
- `lib/domain/provas.ts`: `diasAte(data, hoje)` e `topicosComProvaEm14Dias(provas, hoje)` no fuso SP.
- Ligar `temProvaEm14Dias` no `girar()` da sessão 07 (fator ×2) e no "Por que ele?".
- Card "Próxima prova" no Início (12): título, dias restantes, tópicos com domínio.

## Testes
- `diasAte`: hoje = 0, amanhã = 1; prova no 14º dia entra, no 15º não; virada de dia no fuso SP.

## Pronto quando
- Criar prova com tópico, girar no modo inteligente e ver o peso dobrado (fatia maior e motivo); card do Início correto.
- lint, test e build limpos.

## Fora do escopo
Notificações.
