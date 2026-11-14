"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth/require-user";
import { salvarEstudoPerfil, salvarMetaPerfil, salvarNomePerfil } from "@/lib/db/perfil";
import { EstudoSegundosSchema, MetaRodadasSchema, NomeSchema } from "@/lib/perfil/schema";

export type EstadoNome = { erro?: string; salvo?: boolean };

export async function salvarNome(_anterior: EstadoNome, form: FormData): Promise<EstadoNome> {
  await requireUser();
  const nome = NomeSchema.safeParse(form.get("nome"));
  if (!nome.success) return { erro: nome.error.issues[0]?.message };
  await salvarNomePerfil(nome.data);
  revalidatePath("/", "layout");
  return { salvo: true };
}

export async function salvarEstudo(_anterior: EstadoNome, form: FormData): Promise<EstadoNome> {
  await requireUser();
  const segundos = EstudoSegundosSchema.safeParse(form.get("estudoSegundos"));
  if (!segundos.success) return { erro: segundos.error.issues[0]?.message };
  await salvarEstudoPerfil(segundos.data);
  revalidatePath("/", "layout");
  return { salvo: true };
}

export async function salvarMeta(_anterior: EstadoNome, form: FormData): Promise<EstadoNome> {
  await requireUser();
  const meta = MetaRodadasSchema.safeParse(form.get("metaRodadas"));
  if (!meta.success) return { erro: meta.error.issues[0]?.message };
  await salvarMetaPerfil(meta.data);
  revalidatePath("/", "layout");
  return { salvo: true };
}

export async function sair() {
  await signOut({ redirectTo: "/login" });
}
