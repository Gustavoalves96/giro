import { eq } from "drizzle-orm";
import { db } from "./index";
import { perfil } from "./schema";

// Uma linha por conta. null = perfil ainda não salvo → saudação sem nome.
export async function getPerfil(dono: string) {
  const [linha] = await db.select().from(perfil).where(eq(perfil.dono, dono));
  return linha ?? null;
}

export async function salvarNomePerfil(dono: string, nome: string) {
  await db
    .insert(perfil)
    .values({ dono, nome })
    .onConflictDoUpdate({ target: perfil.dono, set: { nome, atualizadoEm: new Date() } });
}

export async function salvarEstudoPerfil(dono: string, estudoSegundos: number) {
  await db
    .insert(perfil)
    .values({ dono, estudoSegundos })
    .onConflictDoUpdate({ target: perfil.dono, set: { estudoSegundos, atualizadoEm: new Date() } });
}

export async function salvarMetaPerfil(dono: string, metaRodadas: number) {
  await db
    .insert(perfil)
    .values({ dono, metaRodadas })
    .onConflictDoUpdate({ target: perfil.dono, set: { metaRodadas, atualizadoEm: new Date() } });
}
