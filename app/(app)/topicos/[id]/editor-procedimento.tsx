"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { flushSync } from "react-dom";
import { CAMPO, EditorResponsivo } from "@/components/editor-responsivo";
import { Button } from "@/components/ui/button";
import type { Questao } from "@/lib/db/schema";
import { ROTULO_ORIGEM } from "@/lib/questoes/rotulos";
import { cn } from "@/lib/utils";
import { type EstadoProcedimento, salvarProcedimento } from "./actions";
import { Opcoes } from "./editor-questao";

type ProcedimentoEditavel = Pick<Questao, "id" | "enunciado" | "explicacao" | "checklist" | "fonte" | "origem">;
// chave: só para o React e o foco; id: o do banco (passo já salvo), mantido ao reordenar
type PassoEdicao = { chave: string; id?: string; texto: string; critico: boolean };

const ORIGENS = ["manual", "prova_antiga"] as const;
const ICONE = "size-11 px-0 has-[>svg]:px-0 aria-disabled:opacity-40";

export function EditorProcedimento({
  topicoId,
  procedimento,
  ...botao
}: {
  topicoId: string;
  procedimento?: ProcedimentoEditavel;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "ghost";
  ariaLabel?: string;
}) {
  return (
    <EditorResponsivo
      {...botao}
      titulo={procedimento ? "Editar procedimento" : "Novo procedimento"}
      descricao="Nome, material e o passo a passo na ordem em que se faz."
      larguraDialog="sm:max-w-2xl"
      conteudo={(fechar) => <FormProcedimento topicoId={topicoId} procedimento={procedimento} aoSalvar={fechar} />}
    />
  );
}

function FormProcedimento({
  topicoId,
  procedimento,
  aoSalvar,
}: {
  topicoId: string;
  procedimento?: ProcedimentoEditavel;
  aoSalvar: () => void;
}) {
  const [estado, acao, salvando] = useActionState<EstadoProcedimento, FormData>(async (anterior, dados) => {
    const r = await salvarProcedimento(anterior, dados);
    if (r.salvo) aoSalvar();
    return r;
  }, {});
  const [nome, setNome] = useState(procedimento?.enunciado ?? "");
  const [material, setMaterial] = useState(procedimento?.checklist?.material.join("\n") ?? "");
  const [passos, setPassos] = useState<PassoEdicao[]>(() =>
    procedimento?.checklist
      ? procedimento.checklist.passos.map((p) => ({ chave: p.id, ...p }))
      : [
          { chave: "novo-1", texto: "", critico: false },
          { chave: "novo-2", texto: "", critico: false },
        ],
  );
  const [atencao, setAtencao] = useState(procedimento?.explicacao ?? "");
  const [fonte, setFonte] = useState(procedimento?.fonte ?? "");
  const origemEditavel = !procedimento || procedimento.origem === "manual" || procedimento.origem === "prova_antiga";
  const [origem, setOrigem] = useState<string>(procedimento?.origem ?? "manual");
  const id = useId();
  const erro = (campo: keyof NonNullable<EstadoProcedimento["erros"]>) => estado.erros?.[campo]?.[0];
  const campoPasso = (chave: string) => `${id}-passo-${chave}`;

  // Atualiza a lista já (flushSync) para o foco ir ao elemento certo depois de mover, incluir ou remover.
  function mudarEFocar(nova: PassoEdicao[], foco: string) {
    flushSync(() => setPassos(nova));
    document.getElementById(foco)?.focus();
  }
  function mover(i: number, delta: -1 | 1, alvo: "subir" | "descer" | "texto") {
    const j = i + delta;
    if (j < 0 || j >= passos.length) return;
    const nova = [...passos];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    mudarEFocar(nova, `${campoPasso(nova[j].chave)}-${alvo}`);
  }
  function adicionar() {
    const chave = crypto.randomUUID();
    mudarEFocar([...passos, { chave, texto: "", critico: false }], `${campoPasso(chave)}-texto`);
  }
  function remover(i: number) {
    const nova = passos.filter((_, k) => k !== i);
    const vizinho = nova[Math.min(i, nova.length - 1)];
    mudarEFocar(nova, vizinho ? `${campoPasso(vizinho.chave)}-texto` : `${id}-adicionar`);
  }
  const mudar = (i: number, dados: Partial<PassoEdicao>) =>
    setPassos((lista) => lista.map((p, k) => (k === i ? { ...p, ...dados } : p)));

  const criticos = passos.filter((p) => p.critico).length;

  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="topicoId" value={topicoId} />
      {procedimento && <input type="hidden" name="id" value={procedimento.id} />}
      <input
        type="hidden"
        name="passos"
        value={JSON.stringify(passos.map(({ id: idPasso, texto, critico }) => ({ id: idPasso, texto, critico })))}
      />

      <div className="space-y-2">
        <label htmlFor={`${id}-nome`} className="block font-bold">
          Nome do procedimento
        </label>
        <input
          id={`${id}-nome`}
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Coleta de citopatológico"
          autoComplete="off"
          aria-invalid={erro("nome") ? true : undefined}
          aria-describedby={`${id}-nome-erro`}
          className={CAMPO}
        />
        <p id={`${id}-nome-erro`} className="text-warn empty:hidden">
          {erro("nome")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${id}-material`} className="block font-bold">
          Material <span className="font-normal text-ink3">(um por linha, opcional)</span>
        </label>
        <textarea
          id={`${id}-material`}
          name="material"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          rows={3}
          placeholder={"Espéculo\nEspátula de Ayre"}
          aria-invalid={erro("material") ? true : undefined}
          aria-describedby={`${id}-material-erro`}
          className={cn(CAMPO, "h-auto py-3")}
        />
        <p id={`${id}-material-erro`} className="text-warn empty:hidden">
          {erro("material")}
        </p>
      </div>

      <fieldset className="space-y-2" aria-describedby={`${id}-passos-ajuda ${id}-passos-erro`}>
        <legend className="mb-1 font-bold">
          Passos <span className="font-normal text-ink3">· {passos.length} · {criticos} {criticos === 1 ? "crítico" : "críticos"}</span>
        </legend>
        <p id={`${id}-passos-ajuda`} className="text-[13px] text-ink3">
          Na ordem em que se faz, um verbo por passo. Marque “crítico” no que, se esquecido, compromete o exame ou a
          segurança. No teclado, Alt + ↑/↓ no texto do passo muda a ordem.
        </p>
        <ol className="space-y-2">
          {passos.map((p, i) => {
            const n = i + 1;
            const base = campoPasso(p.chave);
            const primeiro = i === 0;
            const ultimo = i === passos.length - 1;
            return (
              <li key={p.chave} className={cn("flex gap-2 rounded-2xl border border-line p-2", p.critico && "border-warn/70")}>
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sf2 font-display text-lg font-bold text-ink2 tabular-nums"
                  aria-hidden
                >
                  {n}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <input
                    id={`${base}-texto`}
                    value={p.texto}
                    onChange={(e) => mudar(i, { texto: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                        e.preventDefault();
                        mover(i, e.key === "ArrowUp" ? -1 : 1, "texto");
                      }
                    }}
                    aria-label={`Passo ${n}`}
                    placeholder={primeiro ? "Higienizar as mãos" : `Passo ${n}`}
                    autoComplete="off"
                    className={CAMPO}
                  />
                  <div className="flex items-center gap-1">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[14px] px-2 font-bold text-ink2 has-checked:text-warn has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50">
                      <input
                        type="checkbox"
                        checked={p.critico}
                        onChange={(e) => mudar(i, { critico: e.target.checked })}
                        aria-label={`Passo ${n} é crítico`}
                        className="size-5 accent-[var(--warn)]"
                      />
                      Crítico
                    </label>
                    <span className="flex-1" />
                    {/* aria-disabled em vez de disabled: o foco fica no botão quando o passo chega na ponta */}
                    <Button
                      type="button"
                      variant="ghost"
                      id={`${base}-subir`}
                      className={ICONE}
                      aria-label={`Subir passo ${n}`}
                      aria-disabled={primeiro || undefined}
                      onClick={() => mover(i, -1, "subir")}
                    >
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      id={`${base}-descer`}
                      className={ICONE}
                      aria-label={`Descer passo ${n}`}
                      aria-disabled={ultimo || undefined}
                      onClick={() => mover(i, 1, "descer")}
                    >
                      <ArrowDown aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className={ICONE}
                      aria-label={`Remover passo ${n}`}
                      onClick={() => remover(i)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <Button type="button" variant="secondary" id={`${id}-adicionar`} onClick={adicionar} disabled={passos.length >= 40}>
          <Plus aria-hidden />
          Adicionar passo
        </Button>
        <p id={`${id}-passos-erro`} className="text-warn empty:hidden">
          {erro("passos")}
        </p>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={`${id}-atencao`} className="block font-bold">
          Pontos de atenção
        </label>
        <textarea
          id={`${id}-atencao`}
          name="pontosDeAtencao"
          value={atencao}
          onChange={(e) => setAtencao(e.target.value)}
          rows={3}
          placeholder="Indicação, cuidados e erros comuns. Aparece depois de conferir os passos."
          aria-invalid={erro("pontosDeAtencao") ? true : undefined}
          aria-describedby={`${id}-atencao-erro`}
          className={cn(CAMPO, "h-auto py-3")}
        />
        <p id={`${id}-atencao-erro`} className="text-warn empty:hidden">
          {erro("pontosDeAtencao")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${id}-fonte`} className="block font-bold">
          Fonte <span className="font-normal text-ink3">(opcional)</span>
        </label>
        <input
          id={`${id}-fonte`}
          name="fonte"
          value={fonte}
          onChange={(e) => setFonte(e.target.value)}
          placeholder="Roteiro de habilidades – GO, p. 4"
          autoComplete="off"
          className={CAMPO}
        />
      </div>

      {origemEditavel ? (
        <Opcoes
          legenda="Origem"
          nome="origem"
          opcoes={ORIGENS}
          rotulos={ROTULO_ORIGEM}
          valor={origem}
          aoMudar={setOrigem}
          erro={erro("origem")}
          colunas="grid-cols-2"
        />
      ) : (
        <p className="text-ink3">Origem: {ROTULO_ORIGEM[procedimento.origem]} (não muda na edição).</p>
      )}

      <Button type="submit" disabled={salvando} className="w-full sm:w-auto">
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
