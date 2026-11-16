CREATE TABLE "conquistas" (
	"dono" text NOT NULL,
	"medalha" text NOT NULL,
	"em" timestamp with time zone DEFAULT now() NOT NULL,
	"sessao_id" uuid,
	CONSTRAINT "conquistas_dono_medalha_pk" PRIMARY KEY("dono","medalha")
);
--> statement-breakpoint
ALTER TABLE "conquistas" ADD CONSTRAINT "conquistas_sessao_id_sessoes_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "public"."sessoes"("id") ON DELETE set null ON UPDATE no action;