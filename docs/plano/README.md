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
| [x] | 10 | [Procedimentos: cadastro e importação](10-procedimentos-cadastro.md) | 05, 06, 09 |
| [x] | 11 | [Procedimentos na rodada](11-procedimentos-rodada.md) | 09, 10 |
| [x] | 12 | [Acertos da rodada + FSRS + Revisão do dia](12-fsrs-revisao.md) | 09, 11 |
| [x] | 16 | [Provas](16-provas.md) | 07 |
| [x] | 13 | [Caderno de erros](13-caderno-erros.md) | 12 |
| [x] | 14 | [Início (painel)](14-inicio.md) | 12, 13, 16 |
| [x] | 15 | [Estatísticas](15-estatisticas.md) | 14 |
| [x] | 19 | [Polimento](19-polimento.md) | 12–16 |
| [x] | 17 | [Simulado](17-simulado.md) | 08, 12 |
| [x] | 18 | [IA opcional](18-ia-opcional.md) | 08, 12 |

06, 07 e 08 podem ser feitas em qualquer ordem depois da 05.
**A tabela está na ordem de execução** (checkup de 13/11/2026); os números dos arquivos não mudaram. A 12 vem primeiro porque mexe no schema enquanto o banco está quase vazio; a 16 sobe porque ela tem prova nas próximas semanas; 17 e 18 ficam por último (são as menos ligadas ao uso diário) e fazem o próprio polimento.
As sessões 10 e 11 (procedimentos) entraram em 13/11/2026, antes do FSRS: assim FSRS, revisão, caderno de erros e estatísticas já nascem tratando os dois tipos de item. As antigas 10–17 viraram 12–19.

## Decisões que valem para todas as sessões
- **Nome do app: Giro.** "RoletaMed" é só o nome da pasta.
- **Nome da usuária:** editável em **Meu perfil** (`/perfil`), tabela `perfil`, usado na saudação. Sem nome → saudação sem nome.
- **Simulado atualiza o FSRS:** toda resposta, em qualquer modo, passa pelo FSRS.
- **Simulado** (decisões de 14/11/2026, sessão 17): questão em branco (na entrega ou no tempo esgotado) conta como erro na nota, mas **não** é gravada em `respostas` nem passa pelo FSRS. Vale 10 pts por acerto, sem bônus de tempo nem sequência; entra no XP, não no recorde. Acesso pela Roleta e pelo Início (não na navegação). **Sair no meio descarta a prova** (a sessão é apagada; nada foi gravado). Recarregar a aba não é sair: continua.
- **Cursor** (sessão 17): regra global em `app/globals.css` dá `cursor: pointer` a botão, `role` button/radio/switch/checkbox, label de campo, checkbox/radio, summary e select; desativado (`:disabled`, `aria-disabled`) volta a `default`.
- **Tailwind v4:** tokens em CSS (`@theme` + variáveis em `:root` / `.dark`), não em `theme.extend`.
- **Tema** claro/escuro com `next-themes`. Componentes shadcn: Button, Badge, ToggleGroup, Switch, Progress, RadioGroup, Textarea, Sheet/Dialog.
- **Cor da disciplina:** guarda só a cor cheia; a tinta clara é calculada com `color-mix(in srgb, <cor> 20%, white)`.
- **Lógica de negócio** em `lib/domain/` como funções puras com teste Vitest, escrita na sessão que precisa dela.
- **Lacunas do design resolvidas sem coluna nova:** "Foque em" = linhas de `topicos.descricao` (some se vazio); "+2 min" só no cliente.
- **Estatísticas** (decisões de 14/11/2026, sessão 15): procedimento conta em "questões respondidas" e em "% de acertos" (usa o `acertou` gravado); "% de acertos (início → fim)" = primeira × última semana **com resposta** das 8; "questões respondidas" é das 8 semanas, XP e maior sequência são de sempre; o ranking mostra todos os tópicos (mesma regra dos pontos fracos). A evolução semanal são três gráficos de uma série alinhados (questões, % de acertos, minutos), sem eixo duplo.
- **Meta de rodadas** (decisão de 14/11/2026, sessão 14): "Rodada de hoje · x de N" no Início é editável em Meu perfil (`perfil.meta_rodadas`, 1 a 20, padrão 4); conta sessões da roleta finalizadas hoje em America/Sao_Paulo.
- **Tempo de estudo:** padrão editável em Meu perfil (`perfil.estudo_segundos`, padrão 600 s) e ajustável na roleta só para a rodada (sessão 09). Textos não citam "10 minutos" fixo; slogan: "Gire. Estude. Domine o tópico."
- **Sair no meio da rodada** (sessão 09): pede confirmação e deixa a sessão **aberta** (`finalizada_em` null). Ela não conta pontos, XP, recorde nem domínio; as respostas já dadas ficam gravadas (com `sessao_id`) e entram no domínio na próxima rodada finalizada do tópico. A URL da sessão continua de onde parou. **Confirmado por ela em 13/11/2026: a rodada fica aberta** (não fecha sozinha); por isso o Início e a Roleta mostram "Continuar rodada" (sessão 14).
- **O que conta onde** (checkup de 13/11/2026): XP, recorde e "rodadas de hoje" contam só sessões **finalizadas**; atividade (sequência de dias, mapa de calor, questões respondidas, % de acertos, minutos) conta por **respostas e tempo de estudo gravados**, mesmo de rodada aberta. Recorde é só do modo roleta.
- **Uma resposta por questão em cada sessão** (sessão 12): índice único em `respostas (sessao_id, questao_id)`; reenviar não grava de novo.
- **Excluir tópico** só quando ele não tem respostas (sessão 12); com histórico, desativar as questões.
- **Caderno de erros é uma tela separada** da Revisão do dia (escolha dela em 13/11/2026), mesmo com a sobreposição com o FSRS.
- **IA:** só "Explique melhor". Gerar questões pelo nome do tópico foi cortado (contraria "conteúdo só das fontes dela"); o botão "Gerar com IA · em breve" saiu na sessão 18.
- **"Explique melhor"** (decisões de 14/11/2026, sessão 18):
  - Como as questões vêm do material dos professores via NotebookLM e o plano gratuito do Gemini pode usar e mostrar a revisores o que recebe, cada questão **nova** pede o OK dela, com esse aviso, antes de enviar. O que já está em cache aparece direto.
  - O botão fica só no feedback imediato de questão errada (roleta, revisão, refazer erros); fora do gabarito do simulado e do Caderno de erros.
  - Modelo `gemini-3.5-flash-lite`, estável. A escolha inicial foi o `gemini-3.8-flash`, mas no teste ele deu 503/504 por alta demanda no plano gratuito; o 3.6-flash levou ~20 s e o Flash-Lite ~1 s. O Google não publica mais o limite do plano gratuito por modelo; no painel do AI Studio dela (14/11/2026) o 3.5-flash-lite tem 15 RPM / 250 mil TPM / **500 RPD**, contra 5 RPM / 20 RPD do 3.8-flash e do 3.6-flash.
- **Procedimentos (manobras e exames):** segundo tipo de item do tópico (`questoes.tipo = 'procedimento'` + `checklist`), praticado na mesma rodada: ela vê o nome, tenta lembrar os passos sem pressão de tempo, confere o checklist e marca lembrei / com erro / esqueci. Conteúdo só das fontes dela (NotebookLM ou manual), nunca gerado por IA na hora. No máximo 1 procedimento por rodada; fora do simulado.
- **Banco zerado na sessão 19** (14/11/2026): tudo o que havia era teste (o seed e rodadas de teste), nada dela. Com OK explícito, a 19 tirou foto (contagem + md5) e backup JSON, apagou só dados (schema e migrations intactos), testou o primeiro uso no banco de verdade e deixou o banco **pronto para o uso real**: só a linha de `perfil` (nome "Ana Laura", 600 s, meta 4). Daqui em diante o banco tem dados dela: teste em disciplina própria ("Teste NN"), com ids guardados e apagados por id no fim; nunca zerar de novo.
- **Primeiro uso no celular** (sessão 19): a barra inferior não tem Provas, então o Início sempre mostra o card "Próxima prova" (sem prova: "Marcar prova").
- **Deploy cedo** (sessão 02), para OAuth e Neon serem testados em produção desde o começo.

## Definição de pronto (toda sessão)
- `npm run lint`, `npm run test` e `npm run build` limpos.
- Dev server rodando: abrir cada página nova **e** conferir que CSS/JS carregam (status e tamanho).
- Toda mutação conferida no banco (query no Neon), não só no teste.
- Olhar nas larguras 1440, 1180, 820 e 390 px e nos dois temas.
- Relatório separa **provado** de **não verificado** (ex.: toque real no iPad, Safari, sensação da animação).

## Em aberto
- O seed (`npm run db:seed`) não está no banco desde a sessão 19. Se for rodado de novo, validar com ela o conteúdo médico antes de usar as questões como material de estudo.
- Validar com ela os primeiros checklists de procedimento importados (ordem dos passos e o que é "crítico") antes de confiar na pontuação. **Em 13/11/2026 ainda não validado** (0 procedimentos no banco). Confirmado na sessão 12: a resposta dela foi "ainda não testei", então o `PROMPT_PROCEDIMENTOS` segue como está; validar quando ela importar os primeiros.
- "Explique melhor" (sessão 18): conferir com as primeiras explicações reais se o texto do Gemini está correto e útil, e se 150 palavras é o tamanho certo. O limite (500 por dia, com cache) não deve pesar. Se a qualidade não bastar, testar de novo o `gemini-3.8-flash` (`MODELO_GEMINI`) quando a demanda baixar.
- Conferir com respostas reais se "Hard acima de 45 s" pune caso clínico de vinheta longa (sessão 12: só havia 15 respostas de teste e nenhuma linha em `revisoes`; ficou para quando houver uso real).
