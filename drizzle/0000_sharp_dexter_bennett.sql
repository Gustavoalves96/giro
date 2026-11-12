CREATE TYPE "public"."dificuldade" AS ENUM('facil', 'media', 'dificil');--> statement-breakpoint
CREATE TYPE "public"."modo_sessao" AS ENUM('roleta', 'simulado', 'revisao', 'erros');--> statement-breakpoint
CREATE TYPE "public"."origem_questao" AS ENUM('notebooklm', 'prova_antiga', 'manual', 'ia');--> statement-breakpoint
CREATE TYPE "public"."tipo_questao" AS ENUM('multipla_escolha', 'verdadeiro_falso', 'caso_clinico');--> statement-breakpoint
CREATE TABLE "disciplinas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cor" text NOT NULL,
	"notebooklm_url" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"arquivada" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "explicacoes_ia" (
	"questao_id" uuid PRIMARY KEY NOT NULL,
	"texto" text NOT NULL,
	"gerado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfil" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"nome" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disciplina_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"data" date NOT NULL,
	"topico_ids" uuid[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topico_id" uuid NOT NULL,
	"tipo" "tipo_questao" NOT NULL,
	"enunciado" text NOT NULL,
	"alternativas" jsonb,
	"gabarito" text NOT NULL,
	"explicacao" text NOT NULL,
	"fonte" text,
	"dificuldade" "dificuldade" DEFAULT 'media' NOT NULL,
	"origem" "origem_questao" NOT NULL,
	"sinalizada_com_erro" boolean DEFAULT false NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "respostas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questao_id" uuid NOT NULL,
	"sessao_id" uuid,
	"resposta_dada" text NOT NULL,
	"acertou" boolean NOT NULL,
	"tempo_ms" integer NOT NULL,
	"respondida_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revisoes" (
	"questao_id" uuid PRIMARY KEY NOT NULL,
	"due" timestamp with time zone NOT NULL,
	"stability" real NOT NULL,
	"difficulty" real NOT NULL,
	"elapsed_days" integer NOT NULL,
	"scheduled_days" integer NOT NULL,
	"reps" integer NOT NULL,
	"lapses" integer NOT NULL,
	"state" integer NOT NULL,
	"last_review" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modo" "modo_sessao" NOT NULL,
	"topico_id" uuid,
	"iniciada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"estudo_segundos" integer DEFAULT 0 NOT NULL,
	"finalizada_em" timestamp with time zone,
	"total_questoes" integer DEFAULT 0 NOT NULL,
	"acertos" integer DEFAULT 0 NOT NULL,
	"pontuacao" integer DEFAULT 0 NOT NULL,
	"maior_sequencia" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topicos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disciplina_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"dominio" real DEFAULT 0 NOT NULL,
	"ultima_vez_estudado" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "explicacoes_ia" ADD CONSTRAINT "explicacoes_ia_questao_id_questoes_id_fk" FOREIGN KEY ("questao_id") REFERENCES "public"."questoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provas" ADD CONSTRAINT "provas_disciplina_id_disciplinas_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplinas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questoes" ADD CONSTRAINT "questoes_topico_id_topicos_id_fk" FOREIGN KEY ("topico_id") REFERENCES "public"."topicos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_questao_id_questoes_id_fk" FOREIGN KEY ("questao_id") REFERENCES "public"."questoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_sessao_id_sessoes_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "public"."sessoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_questao_id_questoes_id_fk" FOREIGN KEY ("questao_id") REFERENCES "public"."questoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_topico_id_topicos_id_fk" FOREIGN KEY ("topico_id") REFERENCES "public"."topicos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topicos" ADD CONSTRAINT "topicos_disciplina_id_disciplinas_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplinas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "questoes_topico_id_idx" ON "questoes" USING btree ("topico_id");--> statement-breakpoint
CREATE INDEX "respostas_questao_id_respondida_em_idx" ON "respostas" USING btree ("questao_id","respondida_em");--> statement-breakpoint
CREATE INDEX "revisoes_due_idx" ON "revisoes" USING btree ("due");--> statement-breakpoint
CREATE INDEX "topicos_disciplina_id_idx" ON "topicos" USING btree ("disciplina_id");