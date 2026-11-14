"use client";

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { explicarMelhor } from "@/app/(app)/questoes/actions";
import { useMovimentoReduzido } from "@/components/movimento-reduzido";
import { Button } from "@/components/ui/button";
import { MSG_FALHA } from "@/lib/ai/mensagens";

type Fase = "inicio" | "buscando" | "confirmar" | "gerando" | "pronto" | "erro";

const ROTULO = "text-[13px] font-bold tracking-[0.06em] uppercase";

/** "Explique melhor (IA)" no feedback de questão errada. Só aparece com GEMINI_API_KEY (prop `ia`). */
export function ExpliqueMelhor({ questaoId }: { questaoId: string }) {
  const reduzir = useMovimentoReduzido();
  const [fase, setFase] = useState<Fase>("inicio");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const enviar = useRef<HTMLButtonElement>(null);
  const abrir = useRef<HTMLButtonElement>(null);
  const resultado = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fase === "confirmar") enviar.current?.focus();
    if (fase === "pronto") resultado.current?.focus({ preventScroll: true });
  }, [fase]);

  async function pedir(confirmado: boolean) {
    setFase(confirmado ? "gerando" : "buscando");
    try {
      const r = await explicarMelhor(questaoId, confirmado);
      if (r.ok) {
        setTexto(r.texto);
        setFase("pronto");
      } else if ("confirmar" in r) setFase("confirmar");
      else {
        setErro(r.mensagem);
        setFase("erro");
      }
    } catch {
      setErro(MSG_FALHA);
      setFase("erro");
    }
  }

  const ocupado = fase === "buscando" || fase === "gerando";

  return (
    <div className="flex flex-col gap-2" data-explique-melhor>
      {/* sempre no DOM: o leitor de tela anuncia carregando, pronto e erro */}
      <p role="status" className={fase === "erro" ? "text-ink2" : "sr-only"}>
        {fase === "gerando" ? "Gerando explicação com IA…" : fase === "pronto" ? "Explicação da IA pronta." : fase === "erro" ? erro : ""}
      </p>

      {fase === "confirmar" ? (
        <div className="rounded-3xl border border-line bg-sf p-5">
          <p className={ROTULO + " text-ink3"}>Antes de enviar</p>
          <p className="mt-2 leading-[1.6]">
            O enunciado, as alternativas, o gabarito e a explicação desta questão vão para o Gemini, do Google, no plano
            gratuito. O Google pode usar esse texto para melhorar os produtos dele, e pessoas podem lê-lo.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button ref={enviar} onClick={() => pedir(true)}>
              Enviar e explicar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFase("inicio");
                requestAnimationFrame(() => abrir.current?.focus());
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : fase === "pronto" ? (
        <motion.div
          ref={resultado}
          tabIndex={-1}
          className="rounded-3xl border border-line bg-sf p-5 outline-none"
          initial={{ opacity: 0, y: reduzir ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduzir ? 0.2 : 0.3 }}
        >
          <p className={ROTULO + " flex items-center gap-1.5 text-ink3"}>
            <Sparkles className="size-4" aria-hidden />
            Explicação da IA
          </p>
          <p className="mt-2 leading-[1.6] whitespace-pre-line">{texto}</p>
          <p className="mt-3 text-[13px] text-ink3">Gerada pelo Gemini a partir desta questão; confira nas suas fontes.</p>
        </motion.div>
      ) : (
        <Button ref={abrir} variant="secondary" onClick={() => pedir(false)} disabled={ocupado} aria-busy={ocupado || undefined}>
          <Sparkles aria-hidden />
          {fase === "gerando" ? "Explicando…" : fase === "erro" ? "Tentar de novo" : "Explique melhor (IA)"}
        </Button>
      )}
    </div>
  );
}
