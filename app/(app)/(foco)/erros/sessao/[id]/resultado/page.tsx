import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultadoSimples } from "@/app/(app)/(foco)/resultado-simples";

export const metadata: Metadata = { title: "Resultado dos erros · Giro" };

type Props = PageProps<"/erros/sessao/[id]/resultado">;

async function Conteudo({ params }: Props) {
  const { id } = await params;
  return (
    <ResultadoSimples
      id={id}
      modo="erros"
      textos={{
        concluida: "Erros refeitos",
        nota: "O que acertou saiu do caderno; o que errou de novo continua nele.",
        voltar: { href: "/erros", rotulo: "Voltar ao caderno" },
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
