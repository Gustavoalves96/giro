ALTER TYPE "public"."tipo_questao" ADD VALUE 'procedimento';--> statement-breakpoint
ALTER TABLE "questoes" ADD COLUMN "checklist" jsonb;