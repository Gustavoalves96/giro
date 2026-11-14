import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Todas as datas em UTC (timestamptz); exibição em America/Sao_Paulo fica na UI.
const tz = { withTimezone: true } as const;
const criadoEm = () => timestamp("criado_em", tz).notNull().defaultNow();

export const tipoQuestao = pgEnum("tipo_questao", [
  "multipla_escolha",
  "verdadeiro_falso",
  "caso_clinico",
  "procedimento",
]);
export const dificuldade = pgEnum("dificuldade", ["facil", "media", "dificil"]);
export const origemQuestao = pgEnum("origem_questao", ["notebooklm", "prova_antiga", "manual", "ia"]);
export const modoSessao = pgEnum("modo_sessao", ["roleta", "simulado", "revisao", "erros"]);

export type Alternativa = { letra: "A" | "B" | "C" | "D" | "E"; texto: string };
// Só procedimentos: ordem do array = ordem dos passos; id estável para a nota de cada passo (sessão 11).
export type Checklist = { material: string[]; passos: { id: string; texto: string; critico: boolean }[] };

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
    alternativas: jsonb("alternativas").$type<Alternativa[]>(), // null em V/F e procedimento
    gabarito: text("gabarito").notNull(), // '' em procedimento
    explicacao: text("explicacao").notNull(), // procedimento: pontos de atenção
    checklist: jsonb("checklist").$type<Checklist>(), // só procedimento
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
  (t) => [
    index("respostas_questao_id_respondida_em_idx").on(t.questaoId, t.respondidaEm),
    // uma resposta por questão em cada sessão: reenviar (wifi caiu) não grava de novo nem avança o FSRS duas vezes
    uniqueIndex("respostas_sessao_questao_uniq").on(t.sessaoId, t.questaoId).where(sql`${t.sessaoId} is not null`),
  ],
);

// Nota de cada passo na conferência de um procedimento (resposta_dada = 'checklist').
export const notaPasso = pgEnum("nota_passo", ["lembrei", "com_erro", "esqueci"]);

export const respostasPassos = pgTable(
  "respostas_passos",
  {
    respostaId: uuid("resposta_id")
      .notNull()
      .references(() => respostas.id, { onDelete: "cascade" }),
    passoId: text("passo_id").notNull(), // id estável do passo em questoes.checklist
    nota: notaPasso("nota").notNull(),
  },
  (t) => [primaryKey({ columns: [t.respostaId, t.passoId] })],
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

// Linha única (id = 1): nome usado na saudação, tempo de estudo padrão e meta de rodadas, editáveis em /perfil.
export const perfil = pgTable("perfil", {
  id: integer("id").primaryKey().default(1),
  nome: text("nome"),
  estudoSegundos: integer("estudo_segundos").notNull().default(600), // tempo de estudo padrão da roleta
  metaRodadas: integer("meta_rodadas").notNull().default(4), // "Rodada de hoje · x de N" no Início (sessão 14)
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
