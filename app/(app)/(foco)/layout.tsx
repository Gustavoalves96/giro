import { X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { IndicadorEtapas, IndicadorEtapasAtual } from "@/components/foco/indicador-etapas";
import { Button } from "@/components/ui/button";

// Estudo, Questões e Resultado: sem navegação, só "Sair" (da sessão) e o progresso.
// [data-foco] faz o layout de (app) esconder a navegação.
export default function FocoLayout({ children }: LayoutProps<"/">) {
  return (
    <div data-foco className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line px-4 py-2 md:px-8">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href="/">
            <X aria-hidden />
            Sair
          </Link>
        </Button>
        <Suspense fallback={<IndicadorEtapas atual={null} />}>
          <IndicadorEtapasAtual />
        </Suspense>
      </header>
      {children}
    </div>
  );
}
