CREATE TYPE "public"."nota_passo" AS ENUM('lembrei', 'com_erro', 'esqueci');--> statement-breakpoint
CREATE TABLE "respostas_passos" (
	"resposta_id" uuid NOT NULL,
	"passo_id" text NOT NULL,
	"nota" "nota_passo" NOT NULL,
	CONSTRAINT "respostas_passos_resposta_id_passo_id_pk" PRIMARY KEY("resposta_id","passo_id")
);
--> statement-breakpoint
ALTER TABLE "respostas_passos" ADD CONSTRAINT "respostas_passos_resposta_id_respostas_id_fk" FOREIGN KEY ("resposta_id") REFERENCES "public"."respostas"("id") ON DELETE cascade ON UPDATE no action;