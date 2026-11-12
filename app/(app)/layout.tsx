import { CircleUser } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { MarcaGiro } from "@/components/marca";
import { LinkPerfil, LinkPerfilAtivo, ListaDestinos, ListaDestinosAtiva } from "@/components/navegacao/itens";

// Uma navegação só; o CSS decide: < md barra inferior · md trilho de 96 px · xl barra lateral de 240 px.
// Telas de foco (app/(app)/(foco)) marcam [data-foco] e a navegação some só com CSS, sem piscar.
const SOME_NO_FOCO = "group-has-[[data-foco]]/app:hidden";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="group/app flex flex-1 flex-col md:flex-row">
      <header
        className={`sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-bg px-4 md:hidden ${SOME_NO_FOCO}`}
      >
        <Link href="/" className="flex min-h-11 items-center gap-2">
          <MarcaGiro className="size-7" />
          <span className="font-display text-xl font-extrabold">giro</span>
        </Link>
        <Link
          href="/perfil"
          aria-label="Meu perfil"
          className="flex size-11 items-center justify-center rounded-full text-ink2 hover:bg-sf2"
        >
          <CircleUser className="size-6" aria-hidden />
        </Link>
      </header>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>

      <nav
        aria-label="Principal"
        className={
          "sticky bottom-0 z-10 flex h-[calc(76px+env(safe-area-inset-bottom))] gap-1 border-t border-line bg-sf px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] " +
          "md:order-first md:top-0 md:h-dvh md:w-24 md:shrink-0 md:flex-col md:items-center md:gap-2 md:self-start md:border-t-0 md:border-r md:px-2 md:py-4 " +
          `xl:w-60 xl:items-stretch xl:px-4 ${SOME_NO_FOCO}`
        }
      >
        <Link href="/" aria-label="giro — início" className="mb-4 hidden min-h-11 items-center gap-3 md:flex xl:px-2">
          <MarcaGiro className="size-10" />
          <span className="hidden font-display text-[28px] font-extrabold xl:inline">giro</span>
        </Link>
        <Suspense fallback={<ListaDestinos pathname={null} />}>
          <ListaDestinosAtiva />
        </Suspense>
        <Suspense fallback={<LinkPerfil pathname={null} />}>
          <LinkPerfilAtivo />
        </Suspense>
      </nav>
    </div>
  );
}
