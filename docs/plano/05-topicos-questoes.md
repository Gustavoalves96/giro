# Sessão 05 — Tópicos + questões manuais

**Depende de:** 04
**Ler antes:** CLAUDE.md §3, §5 (schema Zod e "Manual") · design: "Tópico + importação do NotebookLM"

## Objetivo
Gerenciar os tópicos de uma disciplina e as questões de cada tópico pelo formulário manual.

## Entregáveis
- `/disciplinas/[id]`: cabeçalho com cor e link NotebookLM; lista de tópicos com barra de domínio (cor cheia da disciplina), status "novo" quando sem respostas, nº de questões ativas. Criar / editar / excluir tópico (nome, descrição — o campo explica que cada linha vira um item de "Foque em" no estudo).
- `/topicos/[id]`: caminho (Disciplina › Tópico), domínio, ações "Nova questão" (e espaço reservado para "Gerar com NotebookLM", sessão 06, e "Gerar com IA", sessão 18). Lista de questões: tipo, trecho do enunciado, fonte, taxa de acerto, selos (sinalizada, inativa, origem).
- Formulário de questão: tipo (múltipla escolha / caso clínico / V/F), enunciado, alternativas A–E (somem no V/F), gabarito, explicação, fonte, dificuldade, origem (`manual` ou `prova_antiga`). Editar, ativar / desativar, marcar / desmarcar "sinalizada com erro".
- `lib/import/schemas.ts`: schema do CLAUDE.md §5 + `superRefine`: alternativas obrigatórias exceto V/F; gabarito precisa existir nas alternativas (ou ser V/F); letras sem repetição. **O formulário manual usa este mesmo schema** (a importação da 06 também).

## Regras e detalhes
- Mensagens de validação em português simples.
- Server Actions com `requireUser()`.

## Testes
- Schema: gabarito ausente nas alternativas, V/F sem alternativas (válido), múltipla escolha sem alternativas (inválido), letras repetidas, enunciado curto.

## Pronto quando
- Criar tópico, criar uma questão de cada tipo, editar e desativar — tudo conferido no banco.
- lint, test e build limpos.

## Fora do escopo
Importação (06), IA (18).
