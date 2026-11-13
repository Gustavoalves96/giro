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
| [x] | 05 | [Tópicos + questões manuais](05-topicos-questoes.md) | 04 |
| [x] | 06 | [Importação NotebookLM](06-importacao-notebooklm.md) | 05 |
| [x] | 07 | [Roleta](07-roleta.md) | 05 |
| [x] | 08 | [Componente de questão + pontuação](08-questao-pontuacao.md) | 05 |
| [x] | 09 | [Sessão da roleta](09-sessao-roleta.md) | 07, 08 |
| [ ] | 10 | [Procedimentos: cadastro e importação](10-procedimentos-cadastro.md) | 05, 06, 09 |
| [ ] | 11 | [Procedimentos na rodada](11-procedimentos-rodada.md) | 09, 10 |
| [ ] | 12 | [FSRS + Revisão do dia](12-fsrs-revisao.md) | 09, 11 |
| [ ] | 13 | [Caderno de erros](13-caderno-erros.md) | 09, 11 |
| [ ] | 14 | [Início (painel)](14-inicio.md) | 12 |
| [ ] | 15 | [Estatísticas](15-estatisticas.md) | 09 |
| [ ] | 16 | [Provas](16-provas.md) | 07 |
| [ ] | 17 | [Simulado](17-simulado.md) | 08, 12 |
| [ ] | 18 | [IA opcional](18-ia-opcional.md) | 06, 08 |
| [ ] | 19 | [Polimento](19-polimento.md) | todas |

06, 07 e 08 podem ser feitas em qualquer ordem depois da 05. 15 e 16 também são independentes entre si.
As sessões 10 e 11 (procedimentos) entraram em 13/11/2026, antes do FSRS: assim FSRS, revisão, caderno de erros e estatísticas já nascem tratando os dois tipos de item. As antigas 10–17 viraram 12–19.

## Decisões que valem para todas as sessões
- **Nome do app: Giro.** "RoletaMed" é só o nome da pasta.
- **Nome da usuária:** editável em **Meu perfil** (`/perfil`), tabela `perfil`, usado na saudação. Sem nome → saudação sem nome.
- **Simulado atualiza o FSRS:** toda resposta, em qualquer modo, passa pelo FSRS.
- **Tailwind v4:** tokens em CSS (`@theme` + variáveis em `:root` / `.dark`), não em `theme.extend`.
- **Tema** claro/escuro com `next-themes`. Componentes shadcn: Button, Badge, ToggleGroup, Switch, Progress, RadioGroup, Textarea, Sheet/Dialog.
- **Cor da disciplina:** guarda só a cor cheia; a tinta clara é calculada com `color-mix(in srgb, <cor> 20%, white)`.
- **Lógica de negócio** em `lib/domain/` como funções puras com teste Vitest, escrita na sessão que precisa dela.
- **Lacunas do design resolvidas sem coluna nova:** "Foque em" = linhas de `topicos.descricao` (some se vazio); "Rodada de hoje · x de 2" = meta fixa de 2 sessões por dia (constante); "+2 min" só no cliente.
- **Tempo de estudo:** padrão editável em Meu perfil (`perfil.estudo_segundos`, padrão 600 s) e ajustável na roleta só para a rodada (sessão 09). Textos não citam "10 minutos" fixo; slogan: "Gire. Estude. Domine o tópico."
- **Sair no meio da rodada** (sessão 09): pede confirmação e deixa a sessão **aberta** (`finalizada_em` null). Ela não conta pontos, XP, recorde nem domínio; as respostas já dadas ficam gravadas (com `sessao_id`) e entram no domínio na próxima rodada finalizada do tópico. Estatísticas e painel contam só sessões finalizadas. A URL da sessão continua de onde parou.
- **Procedimentos (manobras e exames):** segundo tipo de item do tópico (`questoes.tipo = 'procedimento'` + `checklist`), praticado na mesma rodada: ela vê o nome, tenta lembrar os passos sem pressão de tempo, confere o checklist e marca lembrei / com erro / esqueci. Conteúdo só das fontes dela (NotebookLM ou manual), nunca gerado por IA na hora. No máximo 1 procedimento por rodada; fora do simulado.
- **Deploy cedo** (sessão 02), para OAuth e Neon serem testados em produção desde o começo.

## Definição de pronto (toda sessão)
- `npm run lint`, `npm run test` e `npm run build` limpos.
- Dev server rodando: abrir cada página nova **e** conferir que CSS/JS carregam (status e tamanho).
- Toda mutação conferida no banco (query no Neon), não só no teste.
- Olhar nas larguras 1440, 1180, 820 e 390 px e nos dois temas.
- Relatório separa **provado** de **não verificado** (ex.: toque real no iPad, Safari, sensação da animação).

## Em aberto
- Validar com ela o conteúdo médico do seed antes de usar as questões como dados de teste.
- Validar com ela os primeiros checklists de procedimento importados (ordem dos passos e o que é "crítico") antes de confiar na pontuação.
