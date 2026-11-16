-- a PK antiga (id) sai antes: não dá para ter duas
ALTER TABLE "perfil" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "perfil" ALTER COLUMN "dono" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "perfil" ADD PRIMARY KEY ("dono");