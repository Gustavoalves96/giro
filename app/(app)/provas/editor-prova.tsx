"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useId, useState, useTransition } from "react";
import { CAMPO, EditorResponsivo } from "@/components/editor-responsivo";
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
import { type EstadoProva, excluir, salvarProva } from "./actions";

type Prova = { id: string; disciplinaId: string; titulo: string; data: string; topicoIds: string[] };
export type Opcoes = {
  disciplinas: { id: string; nome: string; arquivada: boolean }[];
  topicos: { id: string; nome: string; disciplinaId: string }[];
};

export function EditorProva({
  prova,
  opcoes,
  ...botao
}: {
  prova?: Prova;
  opcoes: Opcoes;
  children: React.ReactNode;
  className?: string;
  variant?: "destaque" | "default" | "secondary" | "ghost";
  ariaLabel?: string;
}) {
  return (
    <EditorResponsivo
      {...botao}
      titulo={prova ? "Editar prova" : "Nova prova"}
      descricao="Tópicos marcados ganham fatia maior na roleta nos 14 dias antes da prova."
      conteudo={(fechar) => <FormProva prova={prova} opcoes={opcoes} aoSalvar={fechar} />}
    />
  );
}

function FormProva({ prova, opcoes, aoSalvar }: { prova?: Prova; opcoes: Opcoes; aoSalvar: () => void }) {
  const [estado, acao, salvando] = useActionState<EstadoProva, FormData>(async (anterior, dados) => {
    const r = await salvarProva(anterior, dados);
    if (r.salvo) aoSalvar();
    return r;
  }, {});
  // arquivada só aparece se já for a da prova
  const disciplinas = opcoes.disciplinas.filter((d) => !d.arquivada || d.id === prova?.disciplinaId);
  // controlados: o React limpa campos não controlados depois da action, inclusive quando dá erro
  const [disciplinaId, setDisciplinaId] = useState(prova?.disciplinaId ?? disciplinas[0]?.id ?? "");
  const [titulo, setTitulo] = useState(prova?.titulo ?? "");
  const [data, setData] = useState(prova?.data ?? "");
  const [marcados, setMarcados] = useState<string[]>(prova?.topicoIds ?? []);
  const id = useId();
  const erro = (campo: keyof NonNullable<EstadoProva["erros"]>) => estado.erros?.[campo]?.[0];
  // só os tópicos da disciplina escolhida vão no form (ids de tópicos apagados caem ao salvar)
  const topicos = opcoes.topicos.filter((t) => t.disciplinaId === disciplinaId);

  if (!disciplinas.length) return <p className="text-ink2">Crie uma disciplina antes de marcar uma prova.</p>;

  return (
    <form action={acao} className="space-y-5">
      {prova && <input type="hidden" name="id" value={prova.id} />}

      <div className="space-y-2">
        <label htmlFor={`${id}-disc`} className="block font-bold">
          Disciplina
        </label>
        <select
          id={`${id}-disc`}
          name="disciplinaId"
          value={disciplinaId}
          onChange={(e) => setDisciplinaId(e.target.value)}
          aria-invalid={erro("disciplinaId") ? true : undefined}
          aria-describedby={`${id}-disc-erro`}
          className={CAMPO}
        >
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
              {d.arquivada ? " (arquivada)" : ""}
            </option>
          ))}
        </select>
        <p id={`${id}-disc-erro`} className="text-warn empty:hidden">
          {erro("disciplinaId")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${id}-titulo`} className="block font-bold">
          Título
        </label>
        <input
          id={`${id}-titulo`}
          name="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={80}
          placeholder="Ex.: P2"
          autoComplete="off"
          aria-invalid={erro("titulo") ? true : undefined}
          aria-describedby={`${id}-titulo-erro`}
          className={CAMPO}
        />
        <p id={`${id}-titulo-erro`} className="text-warn empty:hidden">
          {erro("titulo")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${id}-data`} className="block font-bold">
          Data
        </label>
        <input
          id={`${id}-data`}
          name="data"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          aria-invalid={erro("data") ? true : undefined}
          aria-describedby={`${id}-data-erro`}
          className={`${CAMPO} max-w-60`}
        />
        <p id={`${id}-data-erro`} className="text-warn empty:hidden">
          {erro("data")}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-bold">
          Tópicos que caem <span className="font-normal text-ink3">(opcional)</span>
        </legend>
        {topicos.length === 0 ? (
          <p className="text-ink3">Essa disciplina ainda não tem tópicos.</p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {topicos.map((t) => (
              <label key={t.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[14px] px-2 hover:bg-sf2">
                <input
                  type="checkbox"
                  name="topicoIds"
                  value={t.id}
                  checked={marcados.includes(t.id)}
                  onChange={(e) => setMarcados((m) => (e.target.checked ? [...m, t.id] : m.filter((x) => x !== t.id)))}
                  className="size-5 shrink-0 accent-ink"
                />
                <span className="min-w-0 break-words">{t.nome}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <p role="status" className="text-warn empty:hidden">
        {estado.mensagem}
      </p>

      <Button type="submit" disabled={salvando} className="w-full sm:w-auto">
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}

export function ExcluirProva({ id, titulo, className }: { id: string; titulo: string; className?: string }) {
  const [aberto, setAberto] = useState(false);
  const [excluindo, iniciar] = useTransition();
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button variant="ghost" className={className} aria-label={`Excluir ${titulo}`} title="Excluir" onClick={() => setAberto(true)}>
        <Trash2 aria-hidden />
      </Button>
      <DialogContent className="rounded-3xl border-line bg-sf p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Excluir “{titulo}”?</DialogTitle>
          <DialogDescription className="text-base text-ink2">
            Os tópicos dela deixam de ganhar peso extra na roleta. Questões e histórico não mudam.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button
            disabled={excluindo}
            className="bg-warn text-white hover:bg-warn/90 dark:text-[#1b0c08]"
            onClick={() =>
              iniciar(async () => {
                await excluir(id);
                setAberto(false);
              })
            }
          >
            {excluindo ? "Excluindo…" : "Excluir prova"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
