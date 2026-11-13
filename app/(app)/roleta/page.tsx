import type { Metadata } from "next";
import { Suspense } from "react";
import { Roleta } from "@/components/roleta/roleta";
import { listarTopicosRoleta } from "@/lib/db/topicos";
import { candidatoDe } from "@/lib/domain/roleta";

export const metadata: Metadata = { title: "Roleta · Giro" };

// Banco é dado da requisição: fica dentro de <Suspense> (Cache Components). Só carrega as fatias; não sorteia.
async function Conteudo() {
  const linhas = await listarTopicosRoleta();
  const agora = new Date();
  return <Roleta candidatos={linhas.map((l) => candidatoDe(l, agora))} />;
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
