"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
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
  const noResultado = useSelectedLayoutSegments().at(-1) === "resultado";
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

/** Fallback do Suspense: o mesmo botão, desativado até saber a etapa. */
export function SairFocoFallback() {
  return (
    <Button variant="ghost" className="-ml-3" disabled>
      {BOTAO}
    </Button>
  );
}
