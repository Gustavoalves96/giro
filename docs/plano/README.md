# Plano de construção — Giro

Uma sessão do Claude Code por arquivo. Em cada sessão, anexe **só** o arquivo daquela sessão; o `CLAUDE.md` e a `giro — especificação de design.md` já ficam no projeto.

## Como usar
1. Abra uma sessão nova e anexe `docs/plano/NN-*.md`.
2. Peça: "Execute a sessão NN".
3. Ao final, a sessão deve rodar `npm run lint && npm run test && npm run build` e relatar o que foi **provado** e o que **ficou sem verificação**.
4. Marque a caixa abaixo.

## Ordem e dependências

| ✓ | # | Sessão | Depende de |
|---|---|---|---|
| [x] | 00 | [Fundação](00-fundacao.md) | — |
| [x] | 01 | [Banco](01-banco.md) | 00 |
| [x] | 02 | [Auth + deploy](02-auth-deploy.md) | 01 |
| [x] | 03 | [Layout, navegação e Meu perfil](03-layout-navegacao.md) | 02 |
| [x] | 04 | [Disciplinas](04-disciplinas.md) | 03 |
| [ ] | 05 | [Tópicos + questões manuais](05-topicos-questoes.md) | 04 |
| [ ] | 06 | [Importação NotebookLM](06-importacao-notebooklm.md) | 05 |
| [ ] | 07 | [Roleta](07-roleta.md) | 05 |
| [ ] | 08 | [Componente de questão + pontuação](08-questao-pontuacao.md) | 05 |
| [ ] | 09 | [Sessão da roleta](09-sessao-roleta.md) | 07, 08 |
| [ ] | 10 | [FSRS + Revisão do dia](10-fsrs-revisao.md) | 09 |
| [ ] | 11 | [Caderno de erros](11-caderno-erros.md) | 09 |
| [ ] | 12 | [Início (painel)](12-inicio.md) | 10 |
| [ ] | 13 | [Estatísticas](13-estatisticas.md) | 09 |
| [ ] | 14 | [Provas](14-provas.md) | 07 |
| [ ] | 15 | [Simulado](15-simulado.md) | 08, 10 |
| [ ] | 16 | [IA opcional](16-ia-opcional.md) | 06, 08 |
| [ ] | 17 | [Polimento](17-polimento.md) | todas |

06, 07 e 08 podem ser feitas em qualquer ordem depois da 05. 13 e 14 também são independentes entre si.

## Decisões que valem para todas as sessões
- **Nome do app: Giro.** "RoletaMed" é só o nome da pasta.
- **Nome da usuária:** editável em **Meu perfil** (`/perfil`), tabela `perfil`, usado na saudação. Sem nome → saudação sem nome.
- **Simulado atualiza o FSRS:** toda resposta, em qualquer modo, passa pelo FSRS.
- **Tailwind v4:** tokens em CSS (`@theme` + variáveis em `:root` / `.dark`), não em `theme.extend`.
- **Tema** claro/escuro com `next-themes`. Componentes shadcn: Button, Badge, ToggleGroup, Switch, Progress, RadioGroup, Textarea, Sheet/Dialog.
- **Cor da disciplina:** guarda só a cor cheia; a tinta clara é calculada com `color-mix(in srgb, <cor> 20%, white)`.
- **Lógica de negócio** em `lib/domain/` como funções puras com teste Vitest, escrita na sessão que precisa dela.
- **Lacunas do design resolvidas sem coluna nova:** "Foque em" = linhas de `topicos.descricao` (some se vazio); "Rodada de hoje · x de 2" = meta fixa de 2 sessões por dia (constante); "+2 min" só no cliente.
- **Deploy cedo** (sessão 02), para OAuth e Neon serem testados em produção desde o começo.

## Definição de pronto (toda sessão)
- `npm run lint`, `npm run test` e `npm run build` limpos.
- Dev server rodando: abrir cada página nova **e** conferir que CSS/JS carregam (status e tamanho).
- Toda mutação conferida no banco (query no Neon), não só no teste.
- Olhar nas larguras 1440, 1180, 820 e 390 px e nos dois temas.
- Relatório separa **provado** de **não verificado** (ex.: toque real no iPad, Safari, sensação da animação).

## Em aberto
- Validar com ela o conteúdo médico do seed antes de usar as questões como dados de teste.
