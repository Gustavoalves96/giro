# Sessão 09 — Sessão da roleta (estudo → questões → resultado)

**Depende de:** 07, 08
**Ler antes:** CLAUDE.md §4.1, §4.3 · design: "Estudo", "Resultado da sessão", "Resultado" (animação)

## Objetivo
Ligar roleta, timer, quiz e resultado numa rodada completa que mede e atualiza o domínio.

## Entregáveis
- "Começar estudo" cria `sessoes` (`modo='roleta'`, `topico_id`, `iniciada_em`) e vai para o layout de foco:
  - `/roleta/sessao/[id]/estudo`
  - `/roleta/sessao/[id]/questoes`
  - `/roleta/sessao/[id]/resultado`
- **Estudo** (cliente): anel de progresso de 380 px com o tempo em 92 px; padrão 600 s; pausar / retomar; "+2 min"; no último minuto o anel fica dourado e aparece "Falta 1 minuto — feche o raciocínio, sem pressa". À direita: "Abrir no NotebookLM" (nova aba; o timer continua), "Foque em" (linhas de `topicos.descricao`, some se vazio), "Já estou pronta → questões". Salvar `estudo_segundos` efetivo ao sair do estudo. Timer baseado em `Date.now()` (não em contagem de ticks) para não atrasar com a aba em segundo plano.
- **Tempo de estudo configurável** (decisão de 13/11/2026: "os dois"):
  - Padrão em **Meu perfil**: campo "Tempo de estudo padrão" (5 a 60 min, de 5 em 5; padrão 10). Coluna nova `perfil.estudo_segundos int not null default 600` (migration). Validar com Zod no `salvar` do perfil.
  - Ajuste rápido na roleta, **só para aquela rodada**: no card do sorteado, seletor de tempo (começa no padrão do perfil) ao lado de "Começar estudo · N min". O botão mostra o tempo escolhido, não "10 min" fixo. Não muda o padrão.
  - A sessão de estudo começa com o tempo escolhido; "+2 min" continua somando durante a rodada.
- **Questões**: 5 questões do tópico via `selecao-questoes`, usando `Questao` com feedback imediato e `BarraProgresso`.
- **Finalizar** (Server Action): grava `finalizada_em, total_questoes, acertos, pontuacao, maior_sequencia`; recalcula `topicos.dominio` com `lib/domain/dominio.ts`; atualiza `ultima_vez_estudado`.
- `lib/domain/dominio.ts`: últimas 20 respostas; a mais recente pesa 1,0 e cada anterior ×0,9; sem respostas = 0.
- **Resultado**: pontuação, acertos (4/5), maior sequência, tempo; domínio antes → depois em barra (cresce em 1,2 s com atraso de 0,4 s); resposta por questão; selo "Novo recorde!" se for a maior pontuação; ações "Girar de novo", "Revisar N erros" (link para `/erros`, ligado na 13), "Voltar ao início".
- "Sair" no layout de foco pede confirmação. Escolher a opção mais simples para a sessão não finalizada (descartar ou finalizar com o que tiver) e documentar.

## Regras e detalhes
- Tempo efetivo de estudo conta só o tempo não pausado.
- Recorde: comparar com as sessões finalizadas de qualquer modo, exceto simulado.

## Testes
- Domínio: sem respostas = 0; uma resposta certa = 100; decaimento com mistura; só as 20 últimas contam.

## Pronto quando
- Rodada inteira no navegador (girar → estudar → 5 questões → resultado) e conferir no banco `sessoes`, `respostas` e `topicos.dominio`.
- lint, test e build limpos.
- Não verificado automaticamente: timer com a tela do iPad bloqueada / app em segundo plano.

## Fora do escopo
FSRS (12), caderno de erros (13).
