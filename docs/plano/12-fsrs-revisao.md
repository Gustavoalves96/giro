# Sessão 12 — Acertos da rodada + FSRS + Revisão do dia

**Depende de:** 09, 11
**Ler antes:** CLAUDE.md §3 (revisoes), §4.5 · docs/plano/README.md ("O que conta onde")

## Objetivo
Toda resposta alimenta o agendamento FSRS; a tela Revisão mostra o que venceu. Antes disso, fechar os furos da rodada que o FSRS e os outros modos amplificariam.

## Acertos da rodada (checkup de 13/11/2026) — fazer primeiro
- **Resposta idempotente:** índice único parcial `respostas (sessao_id, questao_id) where sessao_id is not null` (migration aditiva; mostrar o SQL e conferir por query que há 0 duplicatas antes de aplicar). `responder()` e `conferirProcedimento()`: no conflito, não gravam de novo e devolvem a conferência da resposta já gravada (resposta perdida no wifi + "tente de novo" não vira duas respostas nem dois avanços do FSRS).
- **Gravação atômica:** resposta, notas dos passos e o upsert em `revisoes` no mesmo `db.batch`.
- **Sessão genérica:** `finalizar()` serve a todos os modos e recalcula o domínio de **todo tópico com resposta na sessão** (não só `sessoes.topico_id`, que é null em revisão, erros e simulado). `carregarSessao` recebe o modo esperado.
- **Recorde só do modo roleta** (antes: qualquer modo exceto simulado; uma revisão de 30 questões viraria recorde eterno).
- **Erros de regra com a mensagem certa:** sessão já finalizada e procedimento inativo voltam como `{ ok: false, mensagem }` (como o checklist alterado já faz) e a tela mostra a mensagem, não "confira a conexão".
- **Excluir tópico** só sem respostas; com histórico, o diálogo explica e manda desativar as questões.
- Apagar `/dev/questao` (e `listarQuestoesExibicao`): grava respostas reais sem sessão, que entram no domínio.
- Provisório: esconder "Revisar N erros" do resultado até a 13; `/` redireciona para `/roleta` até a 14.

## Entregáveis
- Dependência `ts-fsrs`.
- `lib/domain/fsrs.ts`:
  - `notaDaResposta({ acertou, tempoMs })`: errou → Again; acertou e > 45 s → Hard; acertou e < 15 s → Easy; senão Good.
  - `proximoEstado(estadoAtual | null, nota, agora)` com `ts-fsrs`, convertendo de / para as colunas de `revisoes`.
  - `notaDoProcedimento({ fracao, criticosEsquecidos })` (sessão 11): crítico esquecido ou fração < 0,5 → Again; < 0,8 → Hard; < 1 → Good; 1 → Easy. O tempo não entra (procedimento é sem pressão).
- Ligar em `responder()` e em `conferirProcedimento()` (sessão 11): toda resposta, **em qualquer modo, inclusive simulado**, faz upsert em `revisoes`. O agendamento é por item (o procedimento inteiro), não por passo.
- `/revisao`: questões e procedimentos ativos com `due <= now` de todas as disciplinas, contagem por disciplina e estimativa de tempo (~40 s por questão, ~2 min por procedimento). "Revisar agora" cria sessão `modo='revisao'` e usa `Questao` ou `Procedimento` (pelo `tipo`) com feedback imediato; resultado simples no fim.
- Estado vazio: "Nada para revisar hoje" + data da próxima revisão prevista.
- Sem backfill: em 13/11/2026 havia 15 respostas de teste; questão sem linha em `revisoes` entra quando for respondida de novo.
- Conferir com dados reais se "Hard acima de 45 s" não pune caso clínico de vinheta longa; se punir, ajustar o limite por tipo.
- O link para o Caderno de erros nesta tela entra na sessão 13.

## Testes
- Nota nos limites: 14,9 s / 15 s / 45 s / 45,1 s; erro sempre Again.
- Nota do procedimento: crítico esquecido → Again mesmo com fração alta; 0,79 / 0,8 / 1,0.
- `proximoEstado` de questão nova → `due` no futuro e `reps = 1`.
- Função pura dos tópicos a recalcular a partir das respostas da sessão (vários tópicos, sem repetição).

## Pronto quando
- Enviar a mesma resposta duas vezes (questão e procedimento): uma linha só em `respostas`, um avanço só em `revisoes`, mesma conferência devolvida.
- Tentar excluir um tópico com respostas: recusado; sem respostas: excluído.
- Responder questões e ver as linhas em `revisoes`; forçar `due` no passado por query e vê-las em `/revisao`; revisar e ver o `due` avançar.
- lint, test e build limpos.

## Fora do escopo
Card de revisão no Início (14).
