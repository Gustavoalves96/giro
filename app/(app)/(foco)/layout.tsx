import { Suspense } from "react";
import { IndicadorEtapas, IndicadorEtapasAtual } from "@/components/foco/indicador-etapas";
import { SairFoco, SairFocoFallback } from "@/components/foco/sair-foco";

// Estudo, Questões e Resultado: sem navegação, só "Sair" (com confirmação no meio da sessão) e o progresso.
// [data-foco] faz o layout de (app) esconder a navegação.
export default function FocoLayout({ children }: LayoutProps<"/">) {
  return (
    <div data-foco className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line px-4 py-2 md:px-8">
        <Suspense fallback={<SairFocoFallback />}>
          <SairFoco />
        </Suspense>
        <Suspense fallback={<IndicadorEtapas atual={null} />}>
          <IndicadorEtapasAtual />
        </Suspense>
      </header>
      {children}
    </div>
  );
}
