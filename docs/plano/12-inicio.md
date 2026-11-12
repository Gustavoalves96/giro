# Sessão 12 — Início (painel)

**Depende de:** 10
**Ler antes:** CLAUDE.md §4.7 · design: "Início"

## Objetivo
Tela inicial que diz o que fazer agora e mostra o progresso.

## Entregáveis
- Data por extenso e saudação pelo horário em `America/Sao_Paulo` (Bom dia antes das 12 h, Boa tarde antes das 18 h, Boa noite depois) + nome de `perfil` se houver: "Boa noite, Ana! Bora uma rodada?". Sem nome: "Boa noite! Bora uma rodada?".
- Chips: sequência de dias (ouro) e XP total.
- Card escuro com mini-roleta: "Rodada de hoje · x de 2" (meta fixa 2; conta sessões `roleta` finalizadas hoje no fuso SP) e CTA "Girar a roleta".
- Revisão do dia: total vencido, divisão por disciplina, "Revisar agora · ~N min".
- Próxima prova: deixar o espaço; escondido até a sessão 14.
- Pontos fracos: 3 tópicos de menor domínio (só os que já têm respostas).
- Mapa de calor das últimas 14 semanas (questões respondidas por dia), com descrição em texto.
- `lib/domain/stats.ts`: `diaSP(date)`, `streak(diasComSessao, hoje)`, `xpTotal`, `agregarPorDia`.

## Regras e detalhes
- Streak: dias consecutivos com ≥ 1 sessão finalizada, contando até hoje ou ontem (não zera antes do dia acabar).

## Testes
- `diaSP` às 01:00 UTC cai no dia anterior em SP.
- Streak: buraco de um dia zera; hoje sem sessão mas ontem com → mantém.

## Pronto quando
- Os números do Início batem com queries no banco, nas 4 larguras e nos 2 temas.
- lint, test e build limpos.

## Fora do escopo
Página de estatísticas completa (13).
