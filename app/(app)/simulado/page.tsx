import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { disciplinasDoSimulado } from "@/lib/db/simulado";
import { FormSimulado } from "./form-simulado";
import { dono } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Simulado · Giro" };

async function Conteudo() {
  const conta = await dono();
  const disciplinas = await disciplinasDoSimulado(conta);
  if (!disciplinas.length)
    return (
      <section className="max-w-xl rounded-3xl border border-line bg-sf p-6">
        <h2 className="font-display text-[22px] font-extrabold">Ainda não há questões</h2>
        <p className="mt-2 text-ink2">O simulado sorteia questões ativas das suas disciplinas. Cadastre ou importe algumas primeiro.</p>
        <Button asChild className="mt-4">
          <Link href="/disciplinas">
            Ir para Disciplinas
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </section>
    );
  return <FormSimulado disciplinas={disciplinas} />;
}

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="font-display text-[32px] font-extrabold md:text-[34px]">Simulado</h1>
      <p className="mt-1 mb-6 text-ink2">Prova com tempo total. O resultado e o gabarito comentado saem só no fim.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}
