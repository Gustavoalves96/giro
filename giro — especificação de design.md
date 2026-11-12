# giro — especificação de design

Nov 12, 2026 · @Gustavo

## Visão geral

O giro (nome provisório RoletaMed) é um app de prática gamificada para uma estudante de medicina: a roleta sorteia um tópico, ela estuda 10 minutos e responde 5 questões. O canvas de design tem 20 pranchetas: direção visual, notas de animação, 11 telas do iPad em paisagem, 3 de notebook e 4 adaptações para iPad em retrato e celular.

- **Usuária:** uma só, brasileira, estuda no iPad e no notebook; celular é eventual.
- **Papel do app:** praticar. Ler e resumir continua no NotebookLM, que tem atalhos em várias telas.
- **Sensação:** divertido, mas sério. Energético na roleta, calmo no estudo, celebratório nos acertos, gentil nos erros.
- **Interface:** português do Brasil, modo claro e escuro.

O fluxo principal é: Início → Roleta → Estudo (10 min) → Questões (5) → Resultado → girar de novo.

## Identidade visual

Neutros frios de tinta e um único destaque forte, a Brasa, reservado à roleta, ao CTA principal e às conquistas. Nada de azul hospitalar.

**Nome e marca.** Proposta: **giro**, slogan “Gire. Estude 10 minutos. Domine o tópico.” A marca é a própria roleta: quatro quadrantes (Brasa e tinta), centro vazado e ponteiro dourado; funciona como ícone do app. Alternativas: Rodada, Plantão, Sorteio Clínico.

**Paleta (tokens)**

| Token | Uso | Claro | Escuro |
| --- | --- | --- | --- |
| bg | Fundo da tela | #F4F5F7 | #100F17 |
| sf | Superfície de cards | #FFFFFF | #1A1922 |
| sf2 | Superfície secundária, trilhos | #EDEEF2 | #24232E |
| ink | Texto principal, botão primário | #15141F | #F2F1F6 |
| ink2 | Texto secundário | #474857 | #C6C5D1 |
| ink3 | Legendas | #666876 | #9C9BAA |
| line | Bordas | #E0E2E8 | #2F2E3B |
| ac (Brasa) | Roleta, CTA, conquistas | #E8492A | #FF6A45 |
| acink | Links e texto em destaque | #B8341A | #FF8C6E |
| ok (Menta) | Acerto | #0A7F57 | #43D39E |
| warn (Âmbar) | Erro, sempre gentil | #9A5800 | #F6B65A |
| gold (Ouro) | XP, sequência, recordes | #E9A800 | #FFC83D |

Texto sobre Brasa: branco no claro, quase preto (#1B0C08) no escuro, e só em tamanho grande (≥ 19 px negrito). Erro nunca usa vermelho.

**Cores das disciplinas.** Cada disciplina tem uma cor cheia (aro da roleta, pontos, gráficos) e uma tinta clara (fatias e fundos, sempre com texto escuro #15141F). Assim qualquer cor escolhida continua legível.

| Disciplina | Cheia | Tinta clara |
| --- | --- | --- |
| Cardiologia | #D93A49 | #F8D9DC |
| Pneumologia | #2F7BD1 | #D7E6F7 |
| Neurologia | #7C4DD1 | #E6DCF6 |
| Gastroenterologia | #D4861A | #F7E5CC |
| Nefrologia | #0F9488 | #CFEBE8 |
| Endocrinologia | #C2408F | #F4D8E8 |

**Tipografia**

- **Bricolage Grotesque** (400–800): títulos, números, roleta. Letter-spacing −0,02 em.
- **Atkinson Hyperlegible** (400/700): corpo e enunciados. Caso clínico em 18 px / 1,6 (19 px no notebook, 16 px no celular).
- Escala: corpo 16, legenda 13, rótulo de seção 13 px em caixa alta com 0,06 em, títulos de tela 32–34 px, números de destaque 56–96 px com dígitos tabulares.

## Componentes e navegação

Poucos componentes, todos com alvo de toque de 44–60 px e cantos arredondados (12–24 px).

| Componente | Aspecto | Onde aparece |
| --- | --- | --- |
| Botão de destaque | Brasa, 60 px, raio 18, texto 20 px negrito | “Girar a roleta”, “Começar estudo”, “Girar de novo” |
| Botão primário | Tinta, 48–60 px | Confirmar resposta, Próxima questão, Revisar agora |
| Botão secundário / fantasma | Superfície com borda / sem borda | Ações de apoio, NotebookLM, Sinalizar erro |
| Chip | Pílula de 36 px | Sequência (ouro), XP, disciplina (tinta clara + ponto) |
| Alternativa | Linha de 56 px com letra A–E em quadrado de 34 px | Questões; estados: normal, selecionada, correta, sua resposta, esmaecida |
| Barra de domínio | 8–18 px, cor cheia da disciplina | Tópicos, pontos fracos, resultado (antes → depois) |
| Segmentado | Duas opções em trilho sf2 | Modo da roleta, período nas estatísticas |
| Chip de disciplina | Caixa de seleção com a cor + contagem | Filtro da roleta; desligado = tracejado |
| Interruptor | Trilho de 46 × 28 px | Movimento reduzido |

**Navegação.** Seis destinos: Início, Roleta, Revisão, Disciplinas, Estatísticas e Provas.

- **iPad:** trilho lateral de 96 px com ícone sobre rótulo; item ativo em Brasa suave.
- **Notebook:** barra lateral de 240 px com logotipo “giro” e rótulos ao lado do ícone.
- **Celular:** barra inferior de 76 px com 5 abas (Provas sai da barra).
- **Foco:** Estudo, Questão e Resultado escondem a navegação e mostram só “Sair” e o progresso (Estudo · Questões · Resultado).

## Telas

Sete telas desenhadas no iPad em paisagem (1180 × 820 px); Roleta, Estudo e Questão são interativas no protótipo.

### Início

- Data, saudação (“Boa noite !(Dar Bom dia se for dia, Boa Tarde se for tarde, e Boa noite se for noite) Bora uma rodada?”) e chips de sequência (12 dias) e XP (1.240).
- Card principal escuro com mini-roleta: “Rodada de hoje · 0 de 2” e o CTA “Girar a roleta”.
- Revisão do dia: 12 questões, divididas por disciplina, botão “Revisar agora · \~8 min”.
- Próxima prova: Cardiologia P2 em 6 dias, com os tópicos e o domínio de cada um.
- Pontos fracos: os 3 tópicos de menor domínio (Sódio 33%, Valvopatias 39%, Epilepsia 41%).
- Mapa de calor das últimas 14 semanas.

### Roleta (o coração do app)

- **Antes de girar:** roleta de 500 px à esquerda; painel de 340 px à direita com o modo (Inteligente / Sorte pura), as 6 disciplinas com contagem e o interruptor de movimento reduzido. Botão “Girar a roleta” abaixo, e o centro da roleta também gira.
- **Fatias:** tinta clara da disciplina com nome do tópico em texto escuro; aro externo na cor cheia agrupa as disciplinas.
- **Modo Inteligente:** pontos fracos e tópicos da próxima prova ganham fatias maiores. A chance fica visível no tamanho. Em Sorte pura, todas iguais.
- **Visor:** acima da roleta, mostra o tópico sob o ponteiro. Resolve a leitura com 30–40 tópicos.
- **Girando:** nomes borrados, ponteiro inclinado, botão desativado “Girando…”.
- **Sorteado:** confete em volta, card com tópico, disciplina, domínio, “Por que ele?” e as ações “Começar estudo · 10 min”, “Girar de novo” e NotebookLM.
- **Vazia:** sem disciplinas ou questões, a roleta vira um círculo tracejado com “Criar questões”.

### Estudo (10 min, desenhada no escuro)

- Anel de progresso de 380 px com o tempo em 92 px; pausar/retomar e “+2 min”.
- À direita: “Abrir no NotebookLM” (o timer continua), “Foque em” com 3 pontos do tópico e “Já estou pronta → questões”.
- No último minuto o anel fica dourado e aparece “Falta 1 minuto — feche o raciocínio, sem pressa”.

### Questão

- Barra de topo: Sair, “Questão 3 de 5” com 5 segmentos coloridos pelo resultado, sequência e pontos.
- Esquerda: disciplina, tipo (caso clínico), enunciado, pergunta e alternativas A–E. Direita: o painel de resposta.
- **Respondendo:** “Sua vez”, atalhos A–E e Enter, “Confirmar resposta” e “Não sei — mostrar resposta”.
- **Acerto:** alternativa verde com “+20 XP”, “Isso!” e o selo “sequência x3!”.
- **Erro:** a escolhida em âmbar (“Sua resposta”), a correta em verde; “Quase! A correta é a C.”, o motivo e o aviso de que ela volta na revisão.
- Depois de responder: explicação, fonte (“Slide 12 – Aula de IC”), “Explique melhor (IA)”, “Sinalizar erro” e “Próxima questão”.

### Resultado da sessão

- Selo dourado “Novo recorde!”, pontuação (105), acertos (4/5), maior sequência (x3) e tempo.
- Domínio antes → depois (48% → 64%) em barra animada e resposta por questão.
- Ações: “Girar de novo”, “Revisar 1 erro”, “Voltar ao início”.

### Tópico + importação do NotebookLM

- Cabeçalho com caminho, domínio e as ações “Nova questão”, “Gerar com IA” e “Gerar com NotebookLM”.
- Lista de questões com tipo, trecho, fonte e taxa de acerto.
- Painel em 3 passos numerados: copiar o prompt → abrir o caderno → colar a resposta.
- Pré-visualização: 5 válidas ✓ e 1 com problema ⚠ (“sem alternativa correta”), com “Importar 5 questões” e “Corrigir a 6ª”.
- Erro de importação: “Não consegui ler essa resposta”, com a causa em palavras simples e o que fazer.

### Estatísticas

- Quatro números: XP total, maior sequência (15 dias, atual 12), acertos em 8 semanas (58% → 72%) e questões respondidas (486).
- Evolução semanal: barras de questões com a linha de % de acertos.
- Ranking de tópicos do pior para o melhor, e as 3 melhores sessões.
- Mapa de calor do ano.

## Adaptação por dispositivo

Telas largas usam duas colunas; telas estreitas empilham tudo em uma só.

| Dispositivo | Tela de referência | Navegação | Roleta | Questão |
| --- | --- | --- | --- | --- |
| Notebook | 1440 × 900 px | Barra lateral de 240 px com rótulos | Roleta de 580 px + painel de 400 px | Enunciado em 19 px + painel de 480 px, largura máx. 1312 px, atalhos A–E e Enter |
| iPad paisagem | 1180 × 820 px | Trilho de 96 px | Roleta de 500 px + painel de 340 px | Enunciado e alternativas + painel de 420 px |
| iPad retrato | 820 × 1180 px | Trilho de 96 px | Roleta de 540 px em cima; filtros em 2 colunas embaixo | Uma coluna; explicação abaixo das alternativas; sem dicas de teclado |
| Celular | 390 × 844 px | Barra inferior, 5 abas | Roleta de 300 px sem nomes nas fatias (só o visor); filtros de disciplina ocultos | Uma coluna, enunciado em 16 px, alternativas de 50 px, só “Confirmar resposta” |

No canvas, a Questão do notebook aparece no escuro e em estado de acerto, e a do iPad em retrato em estado de erro, para mostrar mais combinações.

## Animação e movimento reduzido

A roleta é o único momento “barulhento”; o resto se move pouco e rápido, e tudo tem versão para prefers-reduced-motion.

**Giro da roleta (cerca de 4,6 s)**

| Quando | O que acontece |
| --- | --- |
| 0–120 ms | Puxada de −8° para trás (antecipação) |
| 120–300 ms | Acelera até o pico |
| 300–4.300 ms | Desacelera com ease \[.15, .75, .18, 1\]; os “tics” se espaçam |
| +300 ms | Passa 2° do ponto e volta numa mola |

- **Tic:** a cada fronteira de fatia o ponteiro gira −18° e volta em mola (stiffness 700, damping 18). Som de 30 ms, volume cai com a velocidade, no máximo 20 tics/s.
- **Parada:** as outras fatias escurecem para 40% (200 ms), o centro pulsa 1 → 1,08 → 1, 16 confetes saem do aro em 900 ms e o card do tópico sobe com mola (500 ms).

**Acerto (900 ms)**

| Quando | O que acontece |
| --- | --- |
| 0 ms | Alternativa fica verde, ✓ entra em mola |
| 120 ms | “+20 XP” sobe 10 px e aparece |
| 150 ms | Selo “sequência x3!” escala 0,6 → 1,12 → 1 |
| 250 ms | Pontos do topo contam 40 → 65 |
| 350 ms | Explicação desliza para dentro |

Na 5ª acertada seguida, mini confete só no selo. Nada pisca nem treme.

**Erro:** sem tremida e sem vermelho. Fade âmbar de 200 ms na escolhida; 150 ms depois a correta ganha contorno verde e a explicação aparece.

**Resultado:** a barra de domínio cresce em 1,2 s (atraso de 0,4 s) e o selo de recorde gira para dentro aos 0,8 s.

**Movimento reduzido**

- Roleta: sem giro; as fatias acendem em 6 passos de 80 ms e o resultado aparece com fade de 200 ms, sem confete. No protótipo, o interruptor troca o giro por um sorteio de 0,7 s.
- Feedback e resultado: só cor e opacidade; números trocam direto; a barra já aparece no valor final.

```js
const rot = useMotionValue(atual)
animate(rot, alvo, { duration: 4.6, ease: [.15, .75, .18, 1] })
useMotionValueEvent(rot, "change", (v) => {
  if (fatiaSobPonteiro(v) !== ultima) tic()
})
const reduz = useReducedMotion()
```

## Acessibilidade e implementação

O design foi feito para caber em Next.js + Tailwind + shadcn/ui + Framer Motion, com contraste AA nos dois temas.

**Acessibilidade**

- Alvos de toque de 44 px no mínimo (botões principais de 48–60 px).
- Contraste AA: texto pequeno nunca sobre Brasa; rótulos cinza testados nos dois temas.
- Acerto e erro se distinguem por cor, luminosidade, ícone e texto (“Correta”, “Sua resposta”), não só por matiz.
- Alternativas como grupo de rádio (`role="radiogroup"`, `aria-checked`); feedback em `role="status"`; o visor da roleta em `aria-live`.
- Atalhos de teclado nas questões: A–E escolhem, Enter confirma (dica escondida em telas de toque).
- Botões só de ícone com `aria-label`; o mapa de calor e os gráficos têm descrição em texto.

**Mapa para o código**

- Tokens de cor como variáveis CSS (`--bg`, `--ink`, `--ac`…) num `:root` e numa classe `.dark`; no Tailwind, `theme.extend.colors` aponta para elas.
- Disciplinas guardam duas cores (cheia e tinta clara); a tinta pode ser gerada da cheia misturando \~80% de branco.
- Roleta: `conic-gradient` para fatias e aro, rótulos posicionados por rotação, e o ângulo de cada fatia proporcional ao peso no modo Inteligente.
- Componentes shadcn/ui que encaixam: Button, Badge (chips), ToggleGroup (modo, período), Switch (movimento reduzido), Progress (domínio), RadioGroup (alternativas), Textarea (colar resposta), Sheet ou Dialog (importação no celular).
- Fontes via `next/font/google`: Bricolage Grotesque e Atkinson Hyperlegible.

## Lacunas e próximos passos

O brief pede algumas telas e estados que o canvas ainda não mostra.

- [ ] Primeiro uso: sem disciplinas e, depois, sem questões, guiando o primeiro passo
- [ ] Carregando / importando
- [ ] Limite diário de IA atingido
- [ ] Revisão do dia e Caderno de erros (mesma tela de questão, com contexto e filtros)
- [ ] Simulado: timer total de prova e feedback só no final
- [ ] Calendário de provas, com contagem regressiva
- [ ] Lista de disciplinas (cor, nº de tópicos, domínio médio, link do NotebookLM)
- [ ] Tela Disciplinas e Estatísticas nas larguras de notebook e celular
- [ ] Definir o nome do app (giro ou outro) e o nome dela na saudação
- [ ] Validar o conteúdo médico de exemplo com ela antes de usar as questões como dados de teste
