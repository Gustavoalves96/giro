"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth/require-user";
import { salvarNomePerfil } from "@/lib/db/perfil";
import { NomeSchema } from "@/lib/perfil/schema";

export type EstadoNome = { erro?: string; salvo?: boolean };

export async function salvarNome(_anterior: EstadoNome, form: FormData): Promise<EstadoNome> {
  await requireUser();
  const nome = NomeSchema.safeParse(form.get("nome"));
  if (!nome.success) return { erro: nome.error.issues[0]?.message };
  await salvarNomePerfil(nome.data);
  revalidatePath("/", "layout");
  return { salvo: true };
}

export async function sair() {
  await signOut({ redirectTo: "/login" });
}
