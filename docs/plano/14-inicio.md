# Sessão 14 — Início (painel)

**Depende de:** 12, 13, 16
**Ler antes:** CLAUDE.md §4.7 · design: "Início" · docs/plano/README.md ("O que conta onde", "Em aberto")

## Objetivo
Tela inicial que diz o que fazer agora e mostra o progresso.

## Entregáveis
- Data por extenso e saudação pelo horário em `America/Sao_Paulo` (Bom dia antes das 12 h, Boa tarde antes das 18 h, Boa noite depois) + nome de `perfil` se houver: "Boa noite, Ana! Bora uma rodada?". Sem nome: "Boa noite! Bora uma rodada?".
- Chips: sequência de dias (ouro) e XP total.
- Card escuro com mini-roleta: "Rodada de hoje · x de 2" (conta sessões `roleta` finalizadas hoje no fuso SP) e CTA "Girar a roleta". **Antes de começar, confirmar a meta com ela:** estuda várias horas por dia e 2 pode ficar pequeno.
- **"Continuar rodada":** se houver sessão `roleta` aberta iniciada hoje (fuso SP), o card mostra o tópico e leva de volta para a etapa em que parou; o mesmo aviso na Roleta. A rodada não fecha sozinha (decisão dela em 13/11/2026).
- **Tempo de estudo que não se perde:** o timer do estudo sobrevive a recarregar a aba (Safari do iPad recarrega ao voltar do NotebookLM) e grava `estudo_segundos` quando a aba é escondida, não só em "Já estou pronta".
- Tirar o redirecionamento provisório de `/` para `/roleta` (sessão 12).
- Revisão do dia: total vencido, divisão por disciplina, "Revisar agora · ~N min"; atalho para o Caderno de erros com a contagem.
- Próxima prova (dados da sessão 16): título, dias restantes, tópicos com domínio; some se não houver prova futura.
- Primeiro uso guiado (veio da 19): sem disciplinas → "Crie sua primeira disciplina"; sem questões → "Gere questões com o NotebookLM"; refletir na Roleta.
- `app/manifest.ts` + ícone da marca para "Adicionar à tela de início" no iPad (veio da 19).
- Pontos fracos: 3 tópicos de menor domínio (só os que já têm respostas).
- Mapa de calor das últimas 14 semanas (questões respondidas por dia), com descrição em texto.
- `lib/domain/stats.ts`: `diaSP(date)`, `streak(diasComAtividade, hoje)`, `xpTotal`, `agregarPorDia`.

## Regras e detalhes
- Streak: dias consecutivos com ≥ 1 **resposta** (mesmo de rodada aberta), contando até hoje ou ontem (não zera antes do dia acabar). Mapa de calor também por respostas; XP só de sessões finalizadas.
- O servidor do Vercel roda em UTC: todo "hoje" e todo agrupamento por dia passa por `diaSP`.

## Testes
- `diaSP` às 01:00 UTC cai no dia anterior em SP.
- Streak: buraco de um dia zera; hoje sem resposta mas ontem com → mantém.

## Pronto quando
- Os números do Início batem com queries no banco, nas 4 larguras e nos 2 temas.
- lint, test e build limpos.

## Fora do escopo
Página de estatísticas completa (15).
