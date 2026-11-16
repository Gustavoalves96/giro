import { Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { ContinuarRodada } from "@/components/continuar-rodada";
import { Roleta } from "@/components/roleta/roleta";
import { contarDisciplinasAtivas } from "@/lib/db/inicio";
import { getPerfil } from "@/lib/db/perfil";
import { provasDesde } from "@/lib/db/provas";
import { rodadaAbertaHoje } from "@/lib/db/sessoes";
import { listarTopicosRoleta } from "@/lib/db/topicos";
import { hojeEmSP, topicosComProvaEm14Dias } from "@/lib/domain/provas";
import { candidatoDe } from "@/lib/domain/roleta";
import { ESTUDO_PADRAO } from "@/lib/perfil/schema";
import { dono } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Roleta · Giro" };

// Banco é dado da requisição: fica dentro de <Suspense> (Cache Components). Só carrega as fatias; não sorteia.
async function Conteudo() {
  const conta = await dono();
  await connection(); // "agora" é da requisição, não do build
  const agora = new Date();
  const hoje = hojeEmSP(agora);
  const [linhas, perfil, provas, aberta, disciplinasAtivas] = await Promise.all([
    listarTopicosRoleta(conta),
    getPerfil(conta),
    provasDesde(conta, hoje),
    rodadaAbertaHoje(conta, agora),
    contarDisciplinasAtivas(conta),
  ]);
  const comProva = topicosComProvaEm14Dias(provas, hoje);
  return (
    <>
      {aberta && (
        <section className="mb-6 rounded-3xl border border-line bg-sf p-5 md:p-6">
          <ContinuarRodada rodada={aberta} />
        </section>
      )}
      <Roleta
        candidatos={linhas.map((l) => candidatoDe(l, agora, comProva))}
        estudoPadrao={perfil?.estudoSegundos ?? ESTUDO_PADRAO}
        disciplinasAtivas={disciplinasAtivas}
      />
      <section aria-labelledby="simulado-titulo" className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-line bg-sf p-5">
        <div className="min-w-0 flex-1 basis-56">
          <h2 id="simulado-titulo" className="font-display text-[20px] font-extrabold">
            Prefere uma prova?
          </h2>
          <p className="text-ink2">Simulado com tempo total e gabarito comentado no fim.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/simulado">
            <Timer aria-hidden />
            Fazer um simulado
          </Link>
        </Button>
      </section>
    </>
  );
}

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 font-display text-[32px] font-extrabold md:text-[34px]">Roleta</h1>
      <Suspense fallback={<div className="mx-auto aspect-square w-full max-w-[540px] animate-pulse rounded-full bg-sf2" aria-busy="true" />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}
