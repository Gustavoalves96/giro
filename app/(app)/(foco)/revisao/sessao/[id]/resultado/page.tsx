import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultadoSimples } from "@/app/(app)/(foco)/resultado-simples";

export const metadata: Metadata = { title: "Resultado da revisão · Giro" };

type Props = PageProps<"/revisao/sessao/[id]/resultado">;

async function Conteudo({ params }: Props) {
  const { id } = await params;
  return (
    <ResultadoSimples
      id={id}
      modo="revisao"
      textos={{
        concluida: "Revisão concluída",
        nota: "Os erros voltam mais cedo; os acertos, mais tarde.",
        voltar: { href: "/revisao", rotulo: "Voltar à revisão" },
      }}
    />
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<div className="m-8 h-96 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
