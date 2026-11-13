# Sessão 11 — Procedimentos na rodada

**Depende de:** 09, 10
**Ler antes:** CLAUDE.md §4.1, §4.3, §4.4 · sessão 10 (modelo `checklist`) · design: "Questão", "Animação e movimento reduzido"

## Objetivo
O procedimento sorteado na rodada vira um **exercício de lembrar**: ela vê só o nome, tenta lembrar os passos (falando em voz alta ou num papel), abre o checklist e marca o que lembrou. Mede, pontua e alimenta o domínio como as questões.

## Fluxo na tela (sem pressão de tempo)
1. **Lembrar:** nome do procedimento, chip da disciplina, selo "Procedimento" e a instrução "Tente lembrar o passo a passo — fale em voz alta ou anote. Sem pressa." Botão "Mostrar checklist" (Enter). Sem timer visível.
2. **Conferir:** material e passos em ordem; cada passo com três opções — **Lembrei**, **Lembrei com erro**, **Esqueci** — e o selo "crítico" quando for o caso. Atalhos: ↑/↓ mudam o passo, 1/2/3 marcam, Enter confirma quando todos estiverem marcados ("Marcar o resto como lembrei" para agilizar).
3. **Feedback:** "% lembrado", passos críticos esquecidos em destaque (âmbar, nunca vermelho), "Pontos de atenção" e fonte; "Sinalizar erro"; "Próxima" / "Ver resultado".

Mesmo layout da questão: duas colunas a partir de `lg`, uma no iPad retrato e no celular; alvos ≥ 44 px; `role="radiogroup"` por passo; feedback em `role="status"`; movimento reduzido = só cor e opacidade.

## Entregáveis
- Tabela nova `respostas_passos (resposta_id fk → respostas on delete cascade, passo_id text, nota enum('lembrei','com_erro','esqueci'), pk (resposta_id, passo_id))` — migration aditiva, SQL mostrado antes de aplicar.
- `lib/domain/procedimento.ts` (puro): `avaliarProcedimento(passos, notas)` → `{ fracao, criticosEsquecidos, acertou }`, com `fracao = (lembrei + 0,5 × com_erro) / total` e **acertou = fração ≥ 0,8 e nenhum crítico esquecido**.
- Pontuação (`lib/domain/pontuacao.ts`): procedimento vale `round(10 × fração)`, **sem bônus de tempo**; entra na sequência como acerto/erro (×1,5 a partir do 3º acerto seguido). `resumoSessao` passa a aceitar os dois tipos; o resultado bate com o servidor.
- Server Action `conferirProcedimento({ questaoId, sessaoId, notas })`: Zod + `requireUser()`; confere que é procedimento ativo, que as notas cobrem **todos** os passos atuais (nem a mais, nem a menos) e que a sessão está aberta; grava `respostas` (`acertou`, `tempo_ms`, `resposta_dada = 'checklist'`) e `respostas_passos`; devolve avaliação, pontos de atenção e fonte. O checklist só vai ao cliente na hora de conferir (antes disso, só o nome).
- Seleção da rodada: candidatas passam a incluir procedimentos (tirar o isolamento da sessão 10); mesma prioridade de `selecionarQuestoes`; **no máximo 1 procedimento por rodada** (constante); total continua 5. Tópico só com procedimentos volta a ganhar fatia na roleta.
- `finalizar()` e a tela de resultado usando os dois tipos: na lista "Resposta por questão", o procedimento mostra "% lembrado" e os passos esquecidos (até 3).
- Componente `components/quiz/Procedimento.tsx` com as mesmas props de `Questao` (`onRespondida`, `onProxima`, `ultima`, `sequenciaAntes`), para a página de questões da rodada escolher pelo `tipo`.

## Regras e detalhes
- Domínio (§4.1) não muda: usa `acertou` de cada resposta, procedimento ou questão.
- Se o procedimento for editado entre abrir e conferir (passos mudaram), a Action recusa com mensagem amigável e a tela recarrega o checklist.
- Erro nunca em vermelho; esquecido = âmbar, lembrado = menta, com erro = âmbar mais claro + texto.

## Testes
- `avaliarProcedimento`: tudo lembrado → 1,0 e acertou; 80% sem crítico esquecido → acertou; 90% com um crítico esquecido → não acertou; "com erro" vale metade.
- Pontuação: procedimento ignora o tempo; sequência mistura questão e procedimento.
- Validação das notas: faltando passo, passo a mais, id desconhecido → recusa.

## Pronto quando
- Rodada inteira no navegador num tópico com questões e um procedimento (criados por query numa disciplina "Teste 11"): girar → estudar → 4 questões + 1 procedimento → resultado; conferir `respostas`, `respostas_passos`, `sessoes` e `topicos.dominio` no banco; apagar os dados de teste no fim e comparar com a listagem inicial.
- Teclado (↑/↓, 1/2/3, Enter), 4 larguras, 2 temas, movimento reduzido.
- lint, test e build limpos.

## Fora do escopo
FSRS do procedimento (12), caderno de erros (13), estatísticas de passos (15).
