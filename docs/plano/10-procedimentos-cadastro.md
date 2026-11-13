# Sessão 10 — Procedimentos: cadastro e importação

**Depende de:** 05, 06, 09
**Ler antes:** CLAUDE.md §1, §3, §5 · sessões 05 e 06 (formulário, `parse-json`, pré-visualização) · este arquivo inteiro

## Objetivo
Um segundo tipo de item dentro dos tópicos, para treinar **manobras e exames** (ex.: "Coleta de citopatológico", "Exame do joelho"): o nome do procedimento e um **checklist de passos** que ela vai tentar lembrar de cabeça (sessão 11). Esta sessão cria o tipo, o cadastro manual e a importação pelo NotebookLM. Ainda **não** entra na rodada.

## Decisões (13/11/2026)
- **Procedimento é um item do tópico**, guardado na própria tabela `questoes` com `tipo = 'procedimento'`. Assim reaproveita tópico, `ativa`, `sinalizada_com_erro`, `origem`, `respostas`, `revisoes`, domínio, roleta e caderno de erros sem tabela paralela.
- **Sem pressão de tempo:** nada de timer de estação; o tempo é registrado, mas não vale pontos (sessão 11).
- **Conteúdo vem das fontes dela** (NotebookLM ou cadastro manual). Nada de IA gerando procedimento na hora: passo inventado ou fora de ordem é pior do que passo nenhum.

## Modelo de dados (migration aditiva)
- `ALTER TYPE tipo_questao ADD VALUE 'procedimento'`.
- Coluna nova `questoes.checklist jsonb null` (só procedimentos):
  `{ material: string[], passos: [{ id: string, texto: string, critico: boolean }] }` — a ordem do array é a ordem dos passos; `id` estável (ex.: `crypto.randomUUID()`), para a sessão 11 guardar a nota de cada passo mesmo depois de edições.
- Como os campos existentes ficam num procedimento:
  - `enunciado` = nome do procedimento;
  - `explicacao` = "Pontos de atenção" (indicação, cuidados, erros comuns), mostrado depois de conferir;
  - `fonte` = de onde veio (aula, slide, roteiro);
  - `alternativas` = null; `gabarito` = `''` (não se aplica); `dificuldade` = padrão.
- Gerar com `npx drizzle-kit generate`, **mostrar o SQL antes de aplicar** e aplicar com `npx drizzle-kit migrate`. Tem que ser só aditivo: o código que está no ar continua funcionando. (No Postgres do Neon, `ADD VALUE` não pode ser usado na mesma transação em que é criado; conferir o SQL gerado.)

## Entregáveis
- **Schema Zod** em `lib/import/schemas.ts` (usado no formulário, na importação e de novo no servidor):
  `ProcedimentoSchema = { nome: 3–120 caracteres, material: string[] (0–30, itens não vazios), passos: [{ texto: 3–300, critico: boolean }] (2–40), pontosDeAtencao: string ≥ 10, fonte?: string }` + o envelope `{ procedimentos: [...] }` para a importação.
- **Prompt do NotebookLM** em `lib/prompts/notebooklm.ts`: `PROMPT_PROCEDIMENTOS` + `montarPromptProcedimentos({ quantidade, topico, disciplina })`, no espírito do prompt de questões:
  - com base EXCLUSIVAMENTE nas fontes do caderno;
  - passos na ordem em que se executam, um verbo por passo, curtos;
  - marcar `"critico": true` só no que, se esquecido, compromete o exame ou a segurança (ex.: identificação, consentimento, higiene, técnica estéril);
  - incluir material e pontos de atenção (erros comuns);
  - responder SOMENTE com JSON no formato do envelope.
- **Importação:** o painel de 3 passos da sessão 06 ganha a escolha "Questões / Procedimentos" (ou um segundo painel com o mesmo componente parametrizado — o que der menos código). `parse-json` reaproveitado; validação **por procedimento**; duplicata = nome normalizado (mesma `normalizarEnunciado`) já existente entre os procedimentos do tópico ou repetido no lote. Pré-visualização mostra nome, nº de passos, quantos críticos e o material. Grava com `origem = 'notebooklm'`, inserção em lote.
- **Cadastro manual** em `/topicos/[id]`: "Novo procedimento" → nome, material (um por linha), lista de passos (adicionar, remover, subir/descer, caixa "crítico"), pontos de atenção, fonte, origem (`manual` ou `prova_antiga`). Editar, ativar/desativar e sinalizar erro como nas questões. Alvos ≥ 44 px; subir/descer também pelo teclado.
- **Tela do tópico:** duas seções, "Questões" e "Procedimentos", cada uma com a sua contagem e os seus botões. Linha do procedimento: nome, "N passos · M críticos", fonte, selos (inativa, sinalizada, origem). `ROTULO_TIPO` ganha "Procedimento". Na lista de tópicos da disciplina, a contagem separa questões e procedimentos.
- **Isolamento até a sessão 11** (o código da rodada não sabe mostrar procedimento): excluir `tipo = 'procedimento'` de `listarCandidatasSessao`, `listarQuestoesExibicao` (`/dev/questao`) e do `exists` de `listarTopicosRoleta` (tópico só com procedimentos não ganha fatia ainda). `responder()` recusa procedimento ("Use a conferência de passos").
- **CLAUDE.md**: atualizar §1, §3 (`tipo` e `checklist`), §5 (importação de procedimentos e o prompt) com o que esta sessão decidiu, para as próximas sessões lerem.

## Regras e detalhes
- Server Actions: Zod + `requireUser()`.
- Ordem dos passos é conteúdo: a importação preserva a ordem do JSON; editar a ordem não troca os `id`.
- Não alterar nem apagar questões existentes.

## Testes
- Schema: menos de 2 passos (inválido); passo vazio; nome curto; `critico` ausente → `false`; material opcional.
- Importação: JSON com cerca ```json e texto em volta; um procedimento inválido no meio de válidos; duplicata contra o tópico e dentro do lote (acentos/espaços).
- `montarPromptProcedimentos` preenche quantidade, tópico e disciplina.

## Pronto quando
- Criar um procedimento à mão e importar 2 por JSON realista do NotebookLM (ex.: "Coleta de citopatológico" e "Exame físico do joelho"), conferindo `questoes.tipo`, `checklist` (ordem e ids) e `origem` no banco; colar de novo não duplica.
- Tópico com procedimentos continua girando e rodando só com as questões (isolamento conferido na roleta e em `/dev/questao`).
- lint, test e build limpos; telas do tópico nas 4 larguras e nos 2 temas.
- Dados de teste numa disciplina "Teste 10" criada por query e apagada no fim (cascade), conferindo que não sobrou nada; nada do seed alterado.

## Fora do escopo
Praticar o procedimento na rodada e pontuação (11), FSRS (12), geração por IA (18).
