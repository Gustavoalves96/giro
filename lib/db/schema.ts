import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Todas as datas em UTC (timestamptz); exibição em America/Sao_Paulo fica na UI.
const tz = { withTimezone: true } as const;
const criadoEm = () => timestamp("criado_em", tz).notNull().defaultNow();

export const tipoQuestao = pgEnum("tipo_questao", ["multipla_escolha", "verdadeiro_falso", "caso_clinico"]);
export const dificuldade = pgEnum("dificuldade", ["facil", "media", "dificil"]);
export const origemQuestao = pgEnum("origem_questao", ["notebooklm", "prova_antiga", "manual", "ia"]);
export const modoSessao = pgEnum("modo_sessao", ["roleta", "simulado", "revisao", "erros"]);

export type Alternativa = { letra: "A" | "B" | "C" | "D" | "E"; texto: string };

export const disciplinas = pgTable("disciplinas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  cor: text("cor").notNull(), // hex da cor cheia; a tinta clara é calculada na UI
  notebooklmUrl: text("notebooklm_url"),
  ordem: integer("ordem").notNull().default(0),
  arquivada: boolean("arquivada").notNull().default(false),
  criadoEm: criadoEm(),
});

export const topicos = pgTable(
  "topicos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    disciplinaId: uuid("disciplina_id")
      .notNull()
      .references(() => disciplinas.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    dominio: real("dominio").notNull().default(0),
    ultimaVezEstudado: timestamp("ultima_vez_estudado", tz),
    criadoEm: criadoEm(),
  },
  (t) => [index("topicos_disciplina_id_idx").on(t.disciplinaId)],
);

export const questoes = pgTable(
  "questoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicoId: uuid("topico_id")
      .notNull()
      .references(() => topicos.id, { onDelete: "cascade" }),
    tipo: tipoQuestao("tipo").notNull(),
    enunciado: text("enunciado").notNull(),
    alternativas: jsonb("alternativas").$type<Alternativa[]>(), // null em V/F
    gabarito: text("gabarito").notNull(),
    explicacao: text("explicacao").notNull(),
    fonte: text("fonte"),
    dificuldade: dificuldade("dificuldade").notNull().default("media"),
    origem: origemQuestao("origem").notNull(),
    sinalizadaComErro: boolean("sinalizada_com_erro").notNull().default(false),
    ativa: boolean("ativa").notNull().default(true),
    criadoEm: criadoEm(),
  },
  (t) => [index("questoes_topico_id_idx").on(t.topicoId)],
);

export const sessoes = pgTable("sessoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  modo: modoSessao("modo").notNull(),
  topicoId: uuid("topico_id").references(() => topicos.id, { onDelete: "set null" }),
  iniciadaEm: timestamp("iniciada_em", tz).notNull().defaultNow(),
  estudoSegundos: integer("estudo_segundos").notNull().default(0),
  finalizadaEm: timestamp("finalizada_em", tz),
  totalQuestoes: integer("total_questoes").notNull().default(0),
  acertos: integer("acertos").notNull().default(0),
  pontuacao: integer("pontuacao").notNull().default(0),
  maiorSequencia: integer("maior_sequencia").notNull().default(0),
});

export const respostas = pgTable(
  "respostas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questaoId: uuid("questao_id")
      .notNull()
      .references(() => questoes.id, { onDelete: "cascade" }),
    sessaoId: uuid("sessao_id").references(() => sessoes.id, { onDelete: "set null" }),
    respostaDada: text("resposta_dada").notNull(),
    acertou: boolean("acertou").notNull(),
    tempoMs: integer("tempo_ms").notNull(),
    respondidaEm: timestamp("respondida_em", tz).notNull().defaultNow(),
  },
  (t) => [index("respostas_questao_id_respondida_em_idx").on(t.questaoId, t.respondidaEm)],
);

// Estado FSRS por questão (ts-fsrs).
export const revisoes = pgTable(
  "revisoes",
  {
    questaoId: uuid("questao_id")
      .primaryKey()
      .references(() => questoes.id, { onDelete: "cascade" }),
    due: timestamp("due", tz).notNull(),
    stability: real("stability").notNull(),
    difficulty: real("difficulty").notNull(),
    elapsedDays: integer("elapsed_days").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    reps: integer("reps").notNull(),
    lapses: integer("lapses").notNull(),
    state: integer("state").notNull(),
    lastReview: timestamp("last_review", tz),
  },
  (t) => [index("revisoes_due_idx").on(t.due)],
);

export const provas = pgTable("provas", {
  id: uuid("id").primaryKey().defaultRandom(),
  disciplinaId: uuid("disciplina_id")
    .notNull()
    .references(() => disciplinas.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  data: date("data").notNull(),
  topicoIds: uuid("topico_ids").array().notNull().default([]),
});

export const explicacoesIa = pgTable("explicacoes_ia", {
  questaoId: uuid("questao_id")
    .primaryKey()
    .references(() => questoes.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  geradoEm: timestamp("gerado_em", tz).notNull().defaultNow(),
});

// Linha única (id = 1): nome usado na saudação e tempo de estudo padrão, editáveis em /perfil.
export const perfil = pgTable("perfil", {
  id: integer("id").primaryKey().default(1),
  nome: text("nome"),
  estudoSegundos: integer("estudo_segundos").notNull().default(600), // tempo de estudo padrão da roleta
  atualizadoEm: timestamp("atualizado_em", tz).notNull().defaultNow(),
});

export type Disciplina = typeof disciplinas.$inferSelect;
export type NovaDisciplina = typeof disciplinas.$inferInsert;
export type Topico = typeof topicos.$inferSelect;
export type NovoTopico = typeof topicos.$inferInsert;
export type Questao = typeof questoes.$inferSelect;
export type NovaQuestao = typeof questoes.$inferInsert;
export type Resposta = typeof respostas.$inferSelect;
export type NovaResposta = typeof respostas.$inferInsert;
export type Revisao = typeof revisoes.$inferSelect;
export type NovaRevisao = typeof revisoes.$inferInsert;
export type Sessao = typeof sessoes.$inferSelect;
export type NovaSessao = typeof sessoes.$inferInsert;
export type Prova = typeof provas.$inferSelect;
export type NovaProva = typeof provas.$inferInsert;
export type ExplicacaoIa = typeof explicacoesIa.$inferSelect;
export type NovaExplicacaoIa = typeof explicacoesIa.$inferInsert;
export type Perfil = typeof perfil.$inferSelect;
export type NovoPerfil = typeof perfil.$inferInsert;
