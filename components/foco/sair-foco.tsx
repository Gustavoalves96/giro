"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import { useTransition } from "react";
import { esquecerProva } from "@/app/(app)/(foco)/simulado/sessao/[id]/questoes/prova";
import { sairDoSimulado } from "@/app/(app)/simulado/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BOTAO = (
  <>
    <X aria-hidden />
    Sair
  </>
);

// Sair no meio da rodada pede confirmação. A sessão fica aberta (não finalizada): não conta pontos,
// recorde nem domínio; as respostas já dadas continuam gravadas. No resultado, sai direto.
export function SairFoco() {
  const segmentos = useSelectedLayoutSegments();
  const noResultado = segmentos.at(-1) === "resultado";
  if (segmentos[0] === "simulado" && !noResultado) return <SairSimulado sessaoId={segmentos[2]} />;
  if (noResultado) {
    return (
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/">{BOTAO}</Link>
      </Button>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="-ml-3">
          {BOTAO}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-line bg-sf p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Sair da rodada?</DialogTitle>
          <DialogDescription className="text-base text-ink2">
            O que você já respondeu fica salvo, mas esta rodada não conta pontos, recorde nem domínio.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button asChild variant="secondary">
            <Link href="/">Sair</Link>
          </Button>
          <DialogClose asChild>
            <Button autoFocus>Continuar a rodada</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simulado: sair descarta a prova (nada foi gravado; as respostas só vão ao banco na entrega).
function SairSimulado({ sessaoId }: { sessaoId: string }) {
  const router = useRouter();
  const [saindo, iniciar] = useTransition();
  function sair() {
    iniciar(async () => {
      esquecerProva(sessaoId);
      await sairDoSimulado(sessaoId).catch(() => {}); // se falhar, fica uma sessão aberta sem resposta: não conta em nada
      router.push("/");
    });
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="-ml-3">
          {BOTAO}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-line bg-sf p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Sair do simulado?</DialogTitle>
          <DialogDescription className="text-base text-ink2">
            A prova é descartada: nada do que você marcou é gravado e ela não conta nota, XP nem revisão.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={sair} disabled={saindo}>
            {saindo ? "Saindo…" : "Descartar e sair"}
          </Button>
          <DialogClose asChild>
            <Button autoFocus>Continuar a prova</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Fallback do Suspense: o mesmo botão, desativado até saber a etapa. */
export function SairFocoFallback() {
  return (
    <Button variant="ghost" className="-ml-3" disabled>
      {BOTAO}
    </Button>
  );
}
