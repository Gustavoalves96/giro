import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Roleta } from "@/components/roleta/roleta";
import { getPerfil } from "@/lib/db/perfil";
import { provasDesde } from "@/lib/db/provas";
import { listarTopicosRoleta } from "@/lib/db/topicos";
import { hojeEmSP, topicosComProvaEm14Dias } from "@/lib/domain/provas";
import { candidatoDe } from "@/lib/domain/roleta";
import { ESTUDO_PADRAO } from "@/lib/perfil/schema";

export const metadata: Metadata = { title: "Roleta · Giro" };

// Banco é dado da requisição: fica dentro de <Suspense> (Cache Components). Só carrega as fatias; não sorteia.
async function Conteudo() {
  await connection(); // "agora" é da requisição, não do build
  const agora = new Date();
  const hoje = hojeEmSP(agora);
  const [linhas, perfil, provas] = await Promise.all([listarTopicosRoleta(), getPerfil(), provasDesde(hoje)]);
  const comProva = topicosComProvaEm14Dias(provas, hoje);
  return (
    <Roleta
      candidatos={linhas.map((l) => candidatoDe(l, agora, comProva))}
      estudoPadrao={perfil?.estudoSegundos ?? ESTUDO_PADRAO}
    />
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
