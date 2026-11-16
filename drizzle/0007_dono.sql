-- Contas por e-mail (16/11/2026): decisão de começar do zero, os dados de antes são apagados.
-- CASCADE leva topicos, questoes, respostas, respostas_passos, revisoes, provas e explicacoes_ia.
TRUNCATE TABLE "disciplinas", "sessoes", "perfil" CASCADE;--> statement-breakpoint
ALTER TABLE "disciplinas" ADD COLUMN "dono" text NOT NULL;--> statement-breakpoint
ALTER TABLE "perfil" ADD COLUMN "dono" text;--> statement-breakpoint
ALTER TABLE "sessoes" ADD COLUMN "dono" text NOT NULL;--> statement-breakpoint
CREATE INDEX "disciplinas_dono_idx" ON "disciplinas" USING btree ("dono");--> statement-breakpoint
CREATE INDEX "sessoes_dono_iniciada_em_idx" ON "sessoes" USING btree ("dono","iniciada_em");