import type { Metadata } from "next";
import { Suspense } from "react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Entrar · Giro" };

const MENSAGENS: Record<string, string> = {
  AccessDenied: "Este e-mail não tem acesso ao Giro. Entre com a conta autorizada.",
};
const MENSAGEM_PADRAO = "Não foi possível entrar agora. Tente de novo.";

// Marca: roleta de 4 quadrantes (Brasa/tinta), centro vazado, ponteiro dourado.
function MarcaGiro({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 108" className={className} aria-hidden="true">
      <path d="M50 64 L50 24 A40 40 0 0 1 90 64 Z" className="fill-ac" />
      <path d="M50 64 L90 64 A40 40 0 0 1 50 104 Z" className="fill-ink" />
      <path d="M50 64 L50 104 A40 40 0 0 1 10 64 Z" className="fill-ac" />
      <path d="M50 64 L10 64 A40 40 0 0 1 50 24 Z" className="fill-ink" />
      <circle cx="50" cy="64" r="13" className="fill-bg" />
      <path d="M40 4 H60 L50 30 Z" className="fill-gold" />
    </svg>
  );
}

async function MensagemErro({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  const codigo = Array.isArray(error) ? error[0] : error;
  if (!codigo) return null;
  return (
    <p role="alert" className="mt-8 w-full rounded-[14px] border border-warn/40 bg-warn/10 px-4 py-3 text-warn">
      {MENSAGENS[codigo] ?? MENSAGEM_PADRAO}
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-bg px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <MarcaGiro className="size-28" />
        <h1 className="mt-5 font-display text-[34px] font-extrabold text-ink">giro</h1>
        <p className="mt-2 text-lg text-ink2">Gire. Estude 10 minutos. Domine o tópico.</p>

        <Suspense>
          <MensagemErro searchParams={searchParams} />
        </Suspense>

        <form
          className="mt-8 w-full"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="destaque" className="w-full">
            Entrar com Google
          </Button>
        </form>
      </div>
    </main>
  );
}
