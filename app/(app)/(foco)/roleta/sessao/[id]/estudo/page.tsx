import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getPerfil } from "@/lib/db/perfil";
import { ESTUDO_PADRAO, EstudoSegundosSchema } from "@/lib/perfil/schema";
import { carregarSessao, rota } from "../carregar";
import { Estudo } from "./estudo";

export const metadata: Metadata = { title: "Estudo · Giro" };

type Props = PageProps<"/roleta/sessao/[id]/estudo">;

async function Conteudo({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const s = await carregarSessao(id, "roleta");
  if (s.finalizadaEm) redirect(rota(id, "resultado"));
  // ?s= é o tempo escolhido na roleta só para esta rodada; sem ele (ou inválido), o padrão do perfil
  const daRodada = EstudoSegundosSchema.safeParse(sp.s);
  const segundos = daRodada.success ? daRodada.data : ((await getPerfil())?.estudoSegundos ?? ESTUDO_PADRAO);
  return (
    <Estudo
      sessaoId={s.id}
      segundos={segundos}
      gravado={s.estudoSegundos}
      topico={s.topico ?? "Tópico excluído"}
      disciplina={s.disciplina}
      cor={s.cor}
      notebooklmUrl={s.notebooklmUrl}
      focos={(s.descricao ?? "")
        .split("\n")
        .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
        .filter(Boolean)}
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
