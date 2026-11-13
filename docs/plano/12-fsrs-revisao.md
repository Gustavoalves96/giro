# Sessão 12 — FSRS + Revisão do dia

**Depende de:** 09, 11
**Ler antes:** CLAUDE.md §3 (revisoes), §4.5

## Objetivo
Toda resposta alimenta o agendamento FSRS; a tela Revisão mostra o que venceu.

## Entregáveis
- Dependência `ts-fsrs`.
- `lib/domain/fsrs.ts`:
  - `notaDaResposta({ acertou, tempoMs })`: errou → Again; acertou e > 45 s → Hard; acertou e < 15 s → Easy; senão Good.
  - `proximoEstado(estadoAtual | null, nota, agora)` com `ts-fsrs`, convertendo de / para as colunas de `revisoes`.
  - `notaDoProcedimento({ fracao, criticosEsquecidos })` (sessão 11): crítico esquecido ou fração < 0,5 → Again; < 0,8 → Hard; < 1 → Good; 1 → Easy. O tempo não entra (procedimento é sem pressão).
- Ligar em `responder()` e em `conferirProcedimento()` (sessão 11): toda resposta, **em qualquer modo, inclusive simulado**, faz upsert em `revisoes`. O agendamento é por item (o procedimento inteiro), não por passo.
- `/revisao`: questões e procedimentos ativos com `due <= now` de todas as disciplinas, contagem por disciplina e estimativa de tempo (~40 s por questão, ~2 min por procedimento). "Revisar agora" cria sessão `modo='revisao'` e usa `Questao` ou `Procedimento` (pelo `tipo`) com feedback imediato; resultado simples no fim.
- Estado vazio: "Nada para revisar hoje" + data da próxima revisão prevista.
- Link para o Caderno de erros (sessão 13) nesta tela.

## Testes
- Nota nos limites: 14,9 s / 15 s / 45 s / 45,1 s; erro sempre Again.
- Nota do procedimento: crítico esquecido → Again mesmo com fração alta; 0,79 / 0,8 / 1,0.
- `proximoEstado` de questão nova → `due` no futuro e `reps = 1`.

## Pronto quando
- Responder questões e ver as linhas em `revisoes`; forçar `due` no passado por query e vê-las em `/revisao`; revisar e ver o `due` avançar.
- lint, test e build limpos.

## Fora do escopo
Card de revisão no Início (14).
