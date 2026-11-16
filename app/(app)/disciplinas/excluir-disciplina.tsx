"use client";

import { Archive, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DISCIPLINA_COM_HISTORICO } from "@/lib/disciplinas/schema";
import { arquivar, excluir } from "./actions";

// Só disciplina sem respostas (o histórico fica); apaga tópicos, questões e provas dela (cascade).
// Com respostas, o diálogo explica e oferece arquivar.
export function ExcluirDisciplina({
  id,
  nome,
  totalTopicos,
  respondida,
  className,
}: {
  id: string;
  nome: string;
  totalTopicos: number;
  respondida: boolean;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [indo, iniciar] = useTransition();
  const [recusa, setRecusa] = useState<string | null>(null);
  const bloqueado = respondida || recusa !== null;
  const aviso = bloqueado
    ? (recusa ?? DISCIPLINA_COM_HISTORICO)
    : totalTopicos === 0
      ? "Ela não tem tópicos. Não dá para desfazer."
      : `${totalTopicos === 1 ? "O tópico dela também será apagado" : `Os ${totalTopicos} tópicos dela também serão apagados`}, com as questões e as provas. Não dá para desfazer.`;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button variant="ghost" className={className} aria-label={`Excluir ${nome}`} title="Excluir" onClick={() => setAberto(true)}>
        <Trash2 aria-hidden />
      </Button>
      <DialogContent className="rounded-3xl border-line bg-sf p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">
            {bloqueado ? `Não dá para excluir “${nome}”` : `Tem certeza que deseja excluir “${nome}”?`}
          </DialogTitle>
          <DialogDescription className="text-base text-ink2">{aviso}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">{bloqueado ? "Fechar" : "Cancelar"}</Button>
          </DialogClose>
          {bloqueado ? (
            <Button disabled={indo} onClick={() => iniciar(async () => arquivar(id, true))}>
              <Archive aria-hidden />
              {indo ? "Arquivando…" : "Arquivar"}
            </Button>
          ) : (
            <Button
              disabled={indo}
              className="bg-warn text-white hover:bg-warn/90 dark:text-[#1b0c08]"
              onClick={() =>
                iniciar(async () => {
                  const r = await excluir(id);
                  if (r.ok) setAberto(false);
                  else setRecusa(r.mensagem);
                })
              }
            >
              {indo ? "Excluindo…" : "Excluir disciplina"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
