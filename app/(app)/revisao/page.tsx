import { NotebookPen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { proximaRevisao, resumoRevisao } from "@/lib/db/revisao";
import { RevisarAgora } from "./revisar-agora";

export const metadata: Metadata = { title: "Revisão do dia · Giro" };

const SEG_QUESTAO = 40;
const SEG_PROCEDIMENTO = 120;
const CARD = "rounded-3xl border border-line bg-sf p-5 md:p-6";
const quando = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Banco é dado da requisição: fica dentro de <Suspense> (Cache Components).
async function Conteudo() {
  await connection(); // "agora" é da requisição, não do build
  const agora = new Date();
  const porDisciplina = await resumoRevisao(agora);
  const questoes = porDisciplina.reduce((t, d) => t + d.questoes, 0);
  const procedimentos = porDisciplina.reduce((t, d) => t + d.procedimentos, 0);
  const total = questoes + procedimentos;

  if (!total) {
    const proxima = await proximaRevisao(agora);
    return (
      <section className={CARD} data-revisao-vazia>
        <h2 className="font-display text-[24px] font-extrabold">Nada para revisar hoje</h2>
        <p className="mt-2 text-ink2">
          {proxima
            ? `Próxima revisão prevista: ${quando.format(proxima)}.`
            : "Cada resposta na roleta agenda a próxima revisão daquela questão."}
        </p>
        <Button asChild variant="secondary" className="mt-5">
          <Link href="/roleta">Girar a roleta</Link>
        </Button>
      </section>
    );
  }

  const minutos = Math.max(1, Math.ceil((questoes * SEG_QUESTAO + procedimentos * SEG_PROCEDIMENTO) / 60));
  return (
    <section className={CARD} data-revisao-total={total}>
      <p className="font-display text-[56px] leading-none font-extrabold tabular-nums">{total}</p>
      <p className="mt-1 text-ink2">
        {[questoes && plural(questoes, "questão venceu", "questões venceram"), procedimentos && plural(procedimentos, "procedimento venceu", "procedimentos venceram")]
          .filter(Boolean)
          .join(" e ")}
        , de todas as disciplinas.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Por disciplina">
        {porDisciplina.map((d) => (
          <li key={d.disciplina}>
            <Badge variant="chip" style={{ backgroundColor: tintaClara(d.cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: d.cor }} aria-hidden />
              {d.disciplina} · <span className="tabular-nums">{d.questoes + d.procedimentos}</span>
            </Badge>
          </li>
        ))}
      </ul>
      <RevisarAgora minutos={minutos} />
    </section>
  );
}

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="font-display text-[32px] font-extrabold md:text-[34px]">Revisão do dia</h1>
      <p className="mt-1 mb-6 text-ink3">O que a repetição espaçada separou para hoje.</p>
      <Suspense fallback={<div className="h-56 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        <Conteudo />
      </Suspense>
      <Button asChild variant="secondary" className="mt-4 w-full sm:w-auto">
        <Link href="/erros">
          <NotebookPen aria-hidden />
          Caderno de erros
        </Link>
      </Button>
    </div>
  );
}
