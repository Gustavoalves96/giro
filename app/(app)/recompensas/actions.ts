"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dono } from "@/lib/auth/require-user";
import { desbloqueiosDaConta, medalhasDaConta } from "@/lib/db/conquistas";
import { resumoSessoes } from "@/lib/db/inicio";
import { salvarRecompensasVistas, salvarVisualPerfil } from "@/lib/db/perfil";
import { nivel } from "@/lib/domain/nivel";
import { xpTotal } from "@/lib/domain/stats";
import { liberado, visuaisDo } from "@/lib/domain/visuais";

const EscolhaSchema = z.object({ tipo: z.enum(["roleta", "moldura"]), id: z.string().min(1).max(40) });

/** Escolhe um estilo da roleta ou uma moldura. Recusa id inexistente e visual ainda bloqueado (confere no servidor). */
export async function escolherVisual(form: FormData) {
  const conta = await dono();
  const { tipo, id } = EscolhaSchema.parse({ tipo: form.get("tipo"), id: form.get("id") });
  const visual = visuaisDo(tipo).find((v) => v.id === id);
  if (!visual) throw new Error("Visual não encontrado.");
  const [sessoes, medalhas] = await Promise.all([resumoSessoes(conta), medalhasDaConta(conta)]);
  if (!liberado(visual.libera, nivel(xpTotal(sessoes)).nivel, new Set(medalhas.map((m) => m.medalha)))) {
    throw new Error("Este visual ainda está bloqueado.");
  }
  await salvarVisualPerfil(conta, tipo === "roleta" ? { estiloRoleta: id } : { moldura: id });
  revalidatePath("/", "layout");
}

/** Ela abriu /recompensas: tudo o que está desbloqueado conta como visto e a bolinha some. Conta no servidor. */
export async function marcarRecompensasVistas() {
  const conta = await dono();
  const { atuais, vistas } = await desbloqueiosDaConta(conta);
  if (atuais <= vistas) return;
  await salvarRecompensasVistas(conta, atuais);
  revalidatePath("/", "layout");
}
