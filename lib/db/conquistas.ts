import { and, asc, eq, sql } from "drizzle-orm";
import { eRetroativa, type Fatos, feitosDeSessoes, medalhasGanhas } from "@/lib/domain/conquistas";
import { agregarPorDia, maiorSequencia, xpTotal } from "@/lib/domain/stats";
import { nivel } from "@/lib/domain/nivel";
import { contarDesbloqueios } from "@/lib/domain/visuais";
import { listarErros } from "./erros";
import { db } from "./index";
import { respostasPorHora, resumoSessoes } from "./inicio";
import { getPerfil } from "./perfil";
import { resumoRevisao } from "./revisao";
import { conquistas, sessoes } from "./schema";

/** O que a conta já fez, para decidir as medalhas. Tudo do histórico inteiro. */
async function fatosDaConta(dono: string, agora: Date): Promise<Fatos> {
  const [ss, horas, revisao, erros, [extra]] = await Promise.all([
    db
      .select({ modo: sessoes.modo, pontuacao: sessoes.pontuacao, finalizadaEm: sessoes.finalizadaEm, acertos: sessoes.acertos, totalQuestoes: sessoes.totalQuestoes })
      .from(sessoes)
      .where(eq(sessoes.dono, dono)),
    respostasPorHora(dono),
    resumoRevisao(dono, agora),
    listarErros(dono),
    db.execute<{ procedimento: boolean; dominado: boolean }>(sql`
      select
        exists (
          select 1 from respostas r
          join questoes q on q.id = r.questao_id
          join topicos t on t.id = q.topico_id
          join disciplinas d on d.id = t.disciplina_id
          where d.dono = ${dono} and q.tipo = 'procedimento'
            and exists (select 1 from respostas_passos rp where rp.resposta_id = r.id)
            and not exists (select 1 from respostas_passos rp where rp.resposta_id = r.id and rp.nota <> 'lembrei')
        ) as procedimento,
        exists (
          select 1 from topicos t
          join disciplinas d on d.id = t.disciplina_id
          where d.dono = ${dono} and t.dominio >= 99.5
            and (select count(*) from respostas r join questoes q on q.id = r.questao_id where q.topico_id = t.id) >= 10
        ) as dominado`).then((r) => r.rows),
  ]);
  const finalizadas = ss.filter((s) => s.finalizadaEm);
  const fez = (modo: string) => finalizadas.some((s) => s.modo === modo);
  return {
    sessoesFinalizadas: finalizadas.length,
    xp: xpTotal(ss),
    respostas: horas.reduce((t, h) => t + h.n, 0),
    maiorSequencia: maiorSequencia(agregarPorDia(horas).keys()),
    ...feitosDeSessoes(ss),
    procedimentoPerfeito: Boolean(extra?.procedimento),
    topicoDominado: Boolean(extra?.dominado),
    revisaoEmDia: fez("revisao") && revisao.every((d) => d.questoes + d.procedimentos === 0),
    cadernoVazio: fez("erros") && erros.length === 0,
  };
}

/**
 * Grava as medalhas que a conta passou a merecer e devolve os ids novos. `sessaoId` = a sessão que acabou de
 * fechar (o resultado dela comemora); null = vindo de uma página, sem comemoração. Idempotente.
 */
export async function verificarConquistas(dono: string, sessaoId: string | null, agora = new Date()) {
  const [f, gravadas] = await Promise.all([fatosDaConta(dono, agora), medalhasDaConta(dono)]);
  const ja = new Set(gravadas.map((g) => g.medalha));
  const novas = medalhasGanhas(f).filter((id) => !ja.has(id));
  if (!novas.length) return [];
  const daSessao = sessaoId && !eRetroativa(gravadas.length, f.sessoesFinalizadas) ? sessaoId : null;
  const r = await db
    .insert(conquistas)
    .values(novas.map((medalha) => ({ dono, medalha, sessaoId: daSessao })))
    .onConflictDoNothing()
    .returning({ medalha: conquistas.medalha });
  return r.map((x) => x.medalha);
}

export async function medalhasDaConta(dono: string) {
  return db.select({ medalha: conquistas.medalha, em: conquistas.em }).from(conquistas).where(eq(conquistas.dono, dono)).orderBy(asc(conquistas.em));
}

/** Medalhas que esta sessão deu (comemoradas no resultado; recarregar mostra as mesmas). */
export async function medalhasDaSessao(dono: string, sessaoId: string) {
  const r = await db
    .select({ medalha: conquistas.medalha })
    .from(conquistas)
    .where(and(eq(conquistas.dono, dono), eq(conquistas.sessaoId, sessaoId)));
  return r.map((x) => x.medalha);
}

/** Desbloqueios atuais e quantos ela já viu em /recompensas (bolinha na navegação e no chip do Início). */
export async function desbloqueiosDaConta(dono: string) {
  const [ss, gravadas, p] = await Promise.all([resumoSessoes(dono), medalhasDaConta(dono), getPerfil(dono)]);
  const atuais = contarDesbloqueios(nivel(xpTotal(ss)).nivel, new Set(gravadas.map((g) => g.medalha)));
  return { atuais, vistas: p?.recompensasVistas ?? 0 };
}
