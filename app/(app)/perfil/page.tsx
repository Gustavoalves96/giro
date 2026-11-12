import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/auth";
import { SeletorTema } from "@/components/seletor-tema";
import { Button } from "@/components/ui/button";
import { getPerfil } from "@/lib/db/perfil";
import { sair } from "./actions";
import { FormNome } from "./form-nome";

export const metadata: Metadata = { title: "Meu perfil · Giro" };

const CARD = "rounded-3xl border border-line bg-sf p-5 md:p-6";

function Rotulo({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase">{children}</h2>;
}

// auth() e o banco são dados da requisição: ficam dentro de <Suspense> (Cache Components).
async function Conta() {
  const [sessao, perfil] = await Promise.all([auth(), getPerfil()]);
  return (
    <>
      <section className={CARD}>
        <Rotulo>Nome</Rotulo>
        <FormNome nomeAtual={perfil?.nome ?? ""} />
      </section>
      <section className={CARD}>
        <Rotulo>Conta</Rotulo>
        <p className="text-ink3">Conectada como</p>
        <p className="mb-4 font-bold break-all">{sessao?.user?.email}</p>
        <form action={sair}>
          <Button type="submit" variant="secondary">
            <LogOut aria-hidden />
            Sair
          </Button>
        </form>
      </section>
    </>
  );
}

export default function PerfilPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <h1 className="font-display text-[32px] font-extrabold md:text-[34px]">Meu perfil</h1>
      <Suspense fallback={<div className={`${CARD} h-40 animate-pulse`} aria-busy="true" />}>
        <Conta />
      </Suspense>
      <section className={CARD}>
        <Rotulo>Tema</Rotulo>
        <SeletorTema />
      </section>
    </div>
  );
}
