# Sessão 06 — Importação NotebookLM

**Depende de:** 05
**Ler antes:** CLAUDE.md §5 inteiro · design: "Tópico + importação do NotebookLM"

## Objetivo
Fluxo principal de criação de questões: copiar prompt → gerar no NotebookLM → colar → pré-visualizar → importar.

## Entregáveis
- `lib/prompts/notebooklm.ts`: o prompt-modelo do CLAUDE.md e `montarPrompt({ quantidade, topico, disciplina })`.
- `lib/import/parse-json.ts`:
  - extrai o JSON de um bloco ```json … ``` ou, se não houver, do primeiro `{` ao último `}`;
  - `JSON.parse` com erro amigável;
  - valida o envelope e depois **cada questão separadamente** com o schema da sessão 05, devolvendo `{ validas, invalidas: [{ indice, motivo }] }`;
  - `normalizarEnunciado()`: minúsculo, `normalize('NFD')` sem diacríticos, espaços colapsados; marca como duplicada a questão cujo enunciado normalizado já existe no tópico ou se repete no próprio lote.
- Painel em `/topicos/[id]` (Sheet no celular), 3 passos numerados:
  1. "Copiar prompt" (quantidade padrão 10) — `navigator.clipboard`.
  2. "Abrir caderno" — `notebooklm_url` da disciplina (se vazio, convidar a cadastrar).
  3. Textarea "Cole a resposta aqui" → "Ler resposta".
- Pré-visualização: válidas ✓, com problema ⚠ (motivo), duplicadas (ignoradas). Botão "Importar N questões" grava com `origem='notebooklm'`.
- Erro de leitura: "Não consegui ler essa resposta", com a causa em palavras simples e o que fazer.

## Regras e detalhes
- A validação roda **de novo no servidor** antes de gravar.
- Inserção em lote numa chamada só.

## Testes
- Texto antes/depois do JSON; cerca ```json; JSON quebrado; mistura de válidas e inválidas; duplicata contra o banco (lista existente passada como argumento) e dentro do lote; acentos e espaços na normalização.

## Pronto quando
- Colar uma resposta real (ou realista) do NotebookLM e ver as questões no banco com `origem='notebooklm'`; colar de novo não duplica.
- lint, test e build limpos.
- Não verificado automaticamente: cópia para a área de transferência no Safari do iPad.

## Fora do escopo
Geração por IA (18).
