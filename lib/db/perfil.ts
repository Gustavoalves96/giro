import { eq } from "drizzle-orm";
import { db } from "./index";
import { perfil } from "./schema";

// Linha única (id = 1). null = perfil ainda não salvo → saudação sem nome.
export async function getPerfil() {
  const [linha] = await db.select().from(perfil).where(eq(perfil.id, 1));
  return linha ?? null;
}

export async function salvarNomePerfil(nome: string) {
  await db
    .insert(perfil)
    .values({ id: 1, nome })
    .onConflictDoUpdate({ target: perfil.id, set: { nome, atualizadoEm: new Date() } });
}

export async function salvarEstudoPerfil(estudoSegundos: number) {
  await db
    .insert(perfil)
    .values({ id: 1, estudoSegundos })
    .onConflictDoUpdate({ target: perfil.id, set: { estudoSegundos, atualizadoEm: new Date() } });
}
