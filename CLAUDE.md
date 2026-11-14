# CLAUDE.md — Sistema de estudos para medicina: **Giro** ("RoletaMed" é só o nome da pasta)

> Contexto para o Claude Code. Leia inteiro antes de começar qualquer tarefa.

## 1. O que é o produto

Aplicação web pessoal de **prática ativa** para uma estudante de medicina (uma única usuária).
O diferencial é **gamificar a prática**: uma roleta animada sorteia um tópico, ela estuda por 10 minutos e depois responde questões, ganha pontos e acompanha a evolução.

Além das questões, o tópico tem **procedimentos** (manobras e exames, ex.: "Coleta de citopatológico"): o nome e um **checklist de passos** que ela tenta lembrar de cabeça e depois confere. Conteúdo só das fontes dela (NotebookLM ou cadastro manual), nunca gerado por IA na hora. Cadastro e importação desde a sessão 10; na rodada desde a 11 (no máximo 1 por rodada, `components/quiz/Procedimento.tsx`, Server Action `conferirProcedimento`, notas em `respostas_passos`). Desde a sessão 12 toda resposta é de uma sessão (`/dev/questao` foi apagada).

**Princípio central:** o sistema é para *praticar, medir e repetir*. Ler e entender o material fica no **NotebookLM**, que já faz isso bem (upload de PDFs, resumos, mapas mentais, áudio, chat com fontes). O sistema **não** reimplementa nada disso. Ele se integra por links.

### Não-objetivos (não construir)
- Upload e armazenamento de PDFs/slides
- Geração de resumos, mapas mentais ou áudio
- Chat com documentos / RAG / embeddings / pgvector
- Multiusuário, times ou ranking público (por enquanto)

## 2. Stack

| Camada | Escolha |
|---|---|
| Framework | **Next.js (App Router) + TypeScript**, front e back no mesmo projeto. Não há back-end separado |
| Back-end | Server Actions e Route Handlers (`app/api/*`) |
| Banco | **Neon** (Postgres serverless) via `@neondatabase/serverless` |
| ORM | **Drizzle ORM** + drizzle-kit (migrations) |
| Validação | **Zod** (formulários, Server Actions e importação de JSON) |
| UI | **Tailwind CSS v4** (tokens em CSS: variáveis em `:root`/`.dark` expostas via `@theme` em `app/globals.css`; não há `tailwind.config` nem `theme.extend`) + shadcn/ui + `next-themes` (classe `.dark`) |
| Animação | Framer Motion (roleta, transições, feedback de acerto/erro) |
| Auth | Auth.js (NextAuth v5) com login Google, restrito a uma allowlist de e-mails via env |
| Repetição espaçada | `ts-fsrs` (algoritmo FSRS, roda local, sem IA) |
| IA (opcional, plano B) | `@google/genai` com Gemini Flash no **plano gratuito** da API |
| Deploy | Vercel (plano Hobby) |

### Restrições importantes
- **Orçamento de IA ≈ zero.** A conta Google é AI Plus, sem créditos de API. Use só o plano gratuito do Gemini, que tem limite diário baixo. Toda chamada de IA deve ser:
  - opcional (o app funciona 100% sem IA),
  - disparada por clique explícito da usuária, nunca automática,
  - com resultado **salvo no banco** para nunca gerar a mesma coisa duas vezes,
  - com tratamento de erro 429 (mensagem amigável: "limite diário de IA atingido, tente amanhã").
- **Nunca** enviar material dos professores para a API. No plano gratuito os dados podem ser usados pelo Google.
- Funções serverless do Vercel têm limite de tempo: nada de processamento longo em request.
- O driver do Neon é HTTP/serverless. A conexão é pela env `DATABASE_URL`.

## 3. Modelo de dados (Drizzle)

```
disciplinas
  id uuid pk, nome text, cor text (hex), notebooklm_url text null,
  ordem int, arquivada bool default false, criado_em timestamptz

topicos
  id uuid pk, disciplina_id fk, nome text, descricao text null,
  dominio real default 0        -- 0..100, cache recalculado após cada sessão
  ultima_vez_estudado timestamptz null, criado_em

questoes
  id uuid pk, topico_id fk,
  tipo enum('multipla_escolha','verdadeiro_falso','caso_clinico','procedimento'),
  enunciado text, alternativas jsonb   -- [{letra:'A', texto:'...'}]
  gabarito text                         -- letra correta, ou 'V'/'F'
  explicacao text, fonte text null      -- ex: "Slide 12 - Aula IC"
  checklist jsonb null                  -- só procedimento:
                                        -- {material: string[], passos: [{id, texto, critico}]}
                                        -- ordem do array = ordem dos passos; id estável (uuid) mesmo ao reordenar/editar
                                        -- num procedimento: enunciado = nome, explicacao = "Pontos de atenção",
                                        -- alternativas = null, gabarito = '', dificuldade = padrão
  dificuldade enum('facil','media','dificil') default 'media',
  origem enum('notebooklm','prova_antiga','manual','ia'),
  sinalizada_com_erro bool default false, ativa bool default true, criado_em

respostas
  id uuid pk, questao_id fk, sessao_id fk null,
  resposta_dada text, acertou bool, tempo_ms int, respondida_em timestamptz
  -- índice único parcial (sessao_id, questao_id) where sessao_id is not null: uma resposta por questão
  -- em cada sessão; reenviar não grava de novo e devolve a conferência já gravada (sessão 12)

respostas_passos                        -- só procedimento (resposta_dada = 'checklist'): uma nota por passo
  resposta_id fk → respostas on delete cascade, passo_id text (id do passo no checklist),
  nota enum('lembrei','com_erro','esqueci'), pk (resposta_id, passo_id)

revisoes                                -- estado FSRS por questão
  questao_id pk/fk, due timestamptz, stability real, difficulty real,
  elapsed_days int, scheduled_days int, reps int, lapses int,
  state int, last_review timestamptz null

sessoes
  id uuid pk, modo enum('roleta','simulado','revisao','erros'),
  topico_id fk null, iniciada_em, estudo_segundos int, finalizada_em null,
  total_questoes int, acertos int, pontuacao int, maior_sequencia int

provas
  id uuid pk, disciplina_id fk, titulo text, data date, topico_ids uuid[]
  -- topico_ids sem FK: ids de tópicos apagados são ignorados (na tela, no peso e na próxima prova)
  -- e caem quando a prova é salva de novo no editor

explicacoes_ia                          -- cache das chamadas de IA
  questao_id pk/fk, texto text, gerado_em

perfil                                  -- linha única (id = 1), editável em /perfil
  id int pk default 1, nome text null,  -- nome usado na saudação; null = saudação sem nome
  atualizado_em timestamptz
```

## 4. Regras de negócio

### 4.1 Domínio do tópico (0–100)
- Média ponderada das **últimas 20 respostas** do tópico, com decaimento: a resposta mais recente pesa 1.0 e cada anterior pesa ×0.9.
- Tópico sem nenhuma resposta tem domínio 0 e status "novo".
- Recalcular e salvar em `topicos.dominio` ao finalizar cada sessão, em qualquer modo: `finalizar()` recalcula o tópico da sessão e **todo tópico com resposta nela** (revisão, erros e simulado têm `topico_id` null).
- **Excluir tópico** só quando ele não tem respostas (o histórico não se apaga); com histórico, o diálogo manda desativar as questões.

### 4.2 Roleta
Dois modos:
- **Inteligente (padrão):** peso de cada tópico =
  `1 + (100 - dominio) / 25`
  `× 1.5` se o tópico nunca foi estudado
  `× 2.0` se o tópico pertence a uma prova nos próximos 14 dias (de hoje até o 14º dia, inclusive; dia civil
  em `America/Sao_Paulo`: `hojeEmSP`, `diasAte` e `topicosComProvaEm14Dias` em `lib/domain/provas.ts`)
  `× 0.5` se foi estudado nas últimas 24 h
- **Sorte pura:** todos os pesos iguais.

Antes de girar, ela pode filtrar por disciplinas e/ou marcar tópicos manualmente.
Só entram tópicos com pelo menos 1 questão ativa. Se a lista ficar vazia, mostrar o motivo.
**O sorteio é feito no servidor** (Server Action). O cliente recebe o resultado e só anima a roleta até parar na fatia correta.

### 4.3 Sessão da roleta
1. Roleta para → mostra o tópico sorteado.
2. **Fase de estudo:** timer de 10 min (configurável, padrão 600 s), com pausar/retomar, "pular para questões" e o botão **"Abrir no NotebookLM"** (`disciplina.notebooklm_url`, nova aba). O timer roda no cliente e o tempo efetivo é salvo em `estudo_segundos`.
3. **Fase de questões:** 5 questões (configurável) do tópico, nesta prioridade:
   1. questões com revisão vencida (`revisoes.due <= now`),
   2. questões nunca respondidas,
   3. questões mais erradas.
   Embaralhar a ordem das alternativas na exibição.
4. Feedback imediato após cada resposta: certo/errado, gabarito, explicação e fonte.
5. **Tela de resultado:** pontuação, acertos, maior sequência, variação de domínio (antes → depois) e recorde pessoal, se houver. **Recorde é só do modo roleta** (uma revisão de 30 questões não vira recorde).

### 4.4 Pontuação
- Acerto: **10 pts**
- Bônus de tempo: `+ max(0, 5 × (1 - tempo_s / 60))`, arredondado (responder rápido vale até +5)
- Sequência: a partir do 3º acerto seguido, `×1.5` nos pontos daquela questão
- Erro: 0 pts (sem penalidade negativa)
- **Procedimento:** fração = (lembrei + 0,5 × com erro) / passos; acertou = fração ≥ 0,8 e nenhum crítico esquecido (`lib/domain/procedimento.ts`). Vale `round(10 × fração)` mesmo sem acertar (crédito parcial), sem bônus de tempo; entra na sequência como acerto/erro (×1,5 só quando acertou)

### 4.5 Repetição espaçada (FSRS)
- Toda resposta, em qualquer modo, atualiza `revisoes` via `ts-fsrs` (`lib/domain/fsrs.ts`), no mesmo `db.batch` da resposta (e das notas dos passos). Agendador sem passos de aprendizado em minutos (`learning_steps: []`): `revisoes` não guarda a posição no passo.
- Mapeamento de nota: errou → `Again`; acertou com tempo > 45 s → `Hard`; acertou → `Good`; acertou em < 15 s → `Easy`.
- Procedimento (o item inteiro, não o passo): crítico esquecido ou fração < 0,5 → `Again`; < 0,8 → `Hard`; < 1 → `Good`; 1 → `Easy` (tempo não entra).
- Modo **"Revisão do dia"** (`/revisao`, sessão `modo='revisao'`): questões e procedimentos ativos com `due <= now`, de todas as disciplinas não arquivadas.

### 4.6 Outros modos
- **Caderno de erros:** questões cuja última resposta foi errada, com filtro por disciplina/tópico. É possível refazer.
- **Simulado:** N questões aleatórias das disciplinas escolhidas, com tempo total de prova, sem feedback até o fim.
- **Calendário de provas** (`/provas`, sessão 16): disciplina, título, data e tópicos da disciplina. Lista com as próximas primeiro (contagem "hoje", "amanhã", "em N dias") e as passadas recolhidas. Afeta o peso da roleta (4.2). A action recusa data inválida, título vazio, disciplina inexistente e tópico de outra disciplina. `proximaProva(hoje)` em `lib/db/provas.ts` alimenta o card do Início (sessão 14).

### 4.7 Painel / "ranking"
Como a usuária é uma só, o ranking é **contra ela mesma**:
- Ranking de tópicos por domínio (do pior para o melhor, para saber o que atacar)
- Top 10 sessões por pontuação (recordes)
- Evolução semanal: acertos %, questões respondidas, minutos estudados
- Sequência de dias estudando (streak) e total de XP (soma das pontuações)
- Mapa de calor de atividade (estilo contribuições do GitHub)

## 5. Importação de questões (fluxo NotebookLM, custo zero de IA)

Esta é a forma **principal** de criar questões.

1. No tópico, ela clica em **"Gerar questões com NotebookLM"**.
2. O app copia para a área de transferência o prompt abaixo, já preenchido com disciplina e tópico.
3. Ela cola no caderno da disciplina no NotebookLM, que gera as questões com base nos arquivos dela.
4. Ela copia a resposta e cola num `<textarea>` do app → **"Importar"**.
5. O app extrai o JSON (aceitar resposta envolta em blocos ```json e texto antes/depois), valida com Zod e mostra uma **pré-visualização** com as questões válidas e as inválidas (com o motivo). Ela confirma → salva com `origem = 'notebooklm'`.
6. Evitar duplicatas: ignorar questão cujo enunciado normalizado (minúsculo, sem acento, sem espaços extras) já exista no tópico.

### Schema de importação (Zod)
```ts
const AlternativaSchema = z.object({ letra: z.enum(['A','B','C','D','E']), texto: z.string().min(1) });
const QuestaoImportSchema = z.object({
  tipo: z.enum(['multipla_escolha','verdadeiro_falso','caso_clinico']),
  enunciado: z.string().min(10),
  alternativas: z.array(AlternativaSchema).min(2).max(5).optional(), // obrigatório exceto V/F
  gabarito: z.string(),       // 'A'..'E' ou 'V'/'F'; deve existir entre as alternativas
  explicacao: z.string().min(10),
  fonte: z.string().optional(),
  dificuldade: z.enum(['facil','media','dificil']).default('media'),
});
const ImportSchema = z.object({ questoes: z.array(QuestaoImportSchema).min(1) });
```

### Prompt-modelo (guardar em `lib/prompts/notebooklm.ts`)
```
Você é um professor de medicina elaborando questões de prova.
Com base EXCLUSIVAMENTE nas fontes deste caderno, crie {{quantidade}} questões sobre o tópico
"{{topico}}" da disciplina "{{disciplina}}".

Regras:
- Misture: ~60% múltipla escolha (5 alternativas, A–E), ~25% caso clínico curto
  (múltipla escolha com vinheta clínica), ~15% verdadeiro/falso.
- Apenas UMA alternativa correta. Distratores plausíveis.
- Explicação de 2 a 4 frases dizendo por que a correta está certa e por que as outras não.
- Em "fonte", indique de qual material/slide/página veio a informação.
- Varie a dificuldade (fácil, média, difícil).
- Não invente nada que não esteja nas fontes.

Responda SOMENTE com JSON válido, sem texto antes ou depois, neste formato:
{"questoes":[{"tipo":"multipla_escolha","enunciado":"...","alternativas":[{"letra":"A","texto":"..."}],
"gabarito":"A","explicacao":"...","fonte":"...","dificuldade":"media"}]}
Para verdadeiro/falso use "tipo":"verdadeiro_falso", omita "alternativas" e use "gabarito":"V" ou "F".
```

Outras formas de criar questões:
- **Manual:** formulário completo (inclusive para questões de **provas antigas**, `origem = 'prova_antiga'`)
- **IA (opcional):** "Gerar 5 questões com IA" usando só o nome do tópico e a descrição. Gemini Flash, mesma saída JSON, mesma validação, `origem = 'ia'`, com selo "gerada por IA, revise". Pré-visualização antes de salvar.

### Procedimentos (mesmo fluxo, painel parametrizado)
Na seção "Procedimentos" do tópico, o mesmo painel de 3 passos (`importar-notebooklm.tsx` com `tipo="procedimentos"`) copia `PROMPT_PROCEDIMENTOS` (`montarPromptProcedimentos` em `lib/prompts/notebooklm.ts`: só das fontes; passos na ordem de execução, um verbo por passo; `critico: true` só no que, se esquecido, compromete o exame ou a segurança; material e pontos de atenção). `lerProcedimentos()` (`lib/import/parse-json.ts`) reaproveita a extração e valida **por procedimento**; duplicata = nome normalizado (`normalizarEnunciado`) já existente **entre os procedimentos** do tópico ou repetido no lote. A importação preserva a ordem do JSON, gera os `id` dos passos e grava com `origem = 'notebooklm'`. Cadastro manual: "Novo procedimento" (passos com adicionar/remover/subir/descer, Alt+↑/↓ no texto, caixa "crítico"; origem `manual` ou `prova_antiga`).

```ts
const PassoSchema = z.object({ texto: z.string().min(3).max(300), critico: z.boolean().default(false) });
const ProcedimentoSchema = z.object({
  nome: z.string().min(3).max(120),
  material: z.array(z.string().min(1)).max(30).default([]),
  passos: z.array(PassoSchema).min(2).max(40),
  pontosDeAtencao: z.string().min(10),
  fonte: z.string().optional(),
});
const ImportProcedimentosSchema = z.object({ procedimentos: z.array(ProcedimentoSchema).min(1) });
```
Formato pedido no prompt: `{"procedimentos":[{"nome":"...","material":["..."],"passos":[{"texto":"...","critico":true}],"pontosDeAtencao":"...","fonte":"..."}]}`.

## 6. Uso de IA permitido (opcional)
1. **"Explique melhor"** numa questão errada: envia enunciado + alternativas + gabarito + explicação e pede uma explicação didática curta. Resultado salvo em `explicacoes_ia`. Se já existir, mostrar sem chamar a API.
2. **Gerar questões pelo nome do tópico** (seção 5).

Encapsular tudo em `lib/ai/` atrás de uma interface (`AIProvider`) para trocar de provedor sem mexer no resto. Se `GEMINI_API_KEY` não estiver definida, esconder os botões de IA.

## 7. Estrutura sugerida

```
app/
  (auth)/login/
  (app)/
    page.tsx                 -> painel (início)
    roleta/                  -> roleta + sessão (estudo → questões → resultado)
    revisao/                 -> revisão do dia (FSRS)
    erros/                   -> caderno de erros
    simulado/
    disciplinas/[id]/        -> tópicos, link NotebookLM
    topicos/[id]/            -> questões, importar, gerar
    provas/                  -> calendário
    estatisticas/
  api/auth/[...nextauth]/
lib/
  db/ (schema.ts, index.ts)
  domain/ (dominio.ts, roleta.ts, pontuacao.ts, fsrs.ts, selecao-questoes.ts)
  import/ (parse-json.ts, schemas.ts)
  prompts/ (notebooklm.ts)
  ai/ (provider.ts, gemini.ts)
components/
  roleta/ quiz/ timer/ ui/ (shadcn)
```

A lógica de negócio fica em `lib/domain/` como **funções puras**, testáveis sem banco.

## 8. Convenções
- TypeScript estrito, sem `any`.
- Todo texto da interface em **português do Brasil**.
- Server Actions validam a entrada com Zod e checam a sessão (auth) em todas as mutações.
- Datas no banco em UTC. Exibição no fuso `America/Sao_Paulo`.
- **Dispositivos:** ela estuda principalmente no **iPad** (toque, retrato e paisagem) e no **notebook**. O celular é secundário, mas deve funcionar. Layout responsivo que aproveita telas maiores (duas colunas a partir de `md`/`lg`), alvos de toque ≥ 44 px e atalhos de teclado nas questões (A–E para escolher, Enter para confirmar/avançar). Testar no Safari do iPadOS.
- Respeitar `prefers-reduced-motion`: a roleta tem versão de animação curta/simples.
- Testes com **Vitest** para `lib/domain/*` e para o parser de importação.

## 9. Variáveis de ambiente
```
DATABASE_URL=            # Neon
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
ALLOWED_EMAILS=          # e-mails permitidos, separados por vírgula
GEMINI_API_KEY=          # opcional
```

## 10. Comandos
```
npm run dev
npm run build
npm run lint
npm run test             # vitest
npx drizzle-kit generate # gerar migration
npx drizzle-kit migrate  # aplicar migration
```

## 11. Roteiro (construir nesta ordem)
1. **Base:** projeto Next.js + Tailwind + shadcn, Drizzle + Neon, Auth.js com allowlist, layout com navegação.
2. **Conteúdo:** CRUD de disciplinas (com link NotebookLM) e tópicos, CRUD manual de questões, importação via JSON (seção 5) com pré-visualização.
3. **Núcleo:** roleta (inteligente/sorte pura) → timer → quiz → resultado, pontuação e domínio.
4. **Retenção:** FSRS, revisão do dia, caderno de erros.
5. **Medição:** painel, estatísticas, recordes, streak, mapa de calor.
6. **Extras:** simulado, calendário de provas (peso na roleta), IA opcional.

Ao terminar cada etapa: rodar lint, testes e build antes de seguir.
