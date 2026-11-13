import { z } from "zod";

// CLAUDE.md §5. Usado pela importação (sessão 06) e pelo formulário manual.
// Fora de lib/db: lib/db/index.ts exige DATABASE_URL e quebraria o Vitest.

export const LETRAS = ["A", "B", "C", "D", "E"] as const;

export const AlternativaSchema = z.object({
  letra: z.enum(LETRAS, { error: "Use as letras A a E nas alternativas." }),
  texto: z.string({ error: "Escreva o texto da alternativa." }).trim().min(1, "Escreva o texto da alternativa."),
});

export const QuestaoImportSchema = z
  .object({
    tipo: z.enum(["multipla_escolha", "verdadeiro_falso", "caso_clinico"], { error: "Escolha o tipo da questão." }),
    enunciado: z
      .string({ error: "Escreva o enunciado." })
      .trim()
      .min(10, "O enunciado precisa de pelo menos 10 caracteres."),
    alternativas: z
      .array(AlternativaSchema)
      .min(2, "Preencha pelo menos 2 alternativas.")
      .max(5, "Use no máximo 5 alternativas.")
      .optional(), // obrigatório exceto V/F
    gabarito: z
      .string({ error: "Escolha a resposta correta." })
      .trim()
      .toUpperCase()
      .min(1, "Escolha a resposta correta."),
    explicacao: z
      .string({ error: "Escreva a explicação." })
      .trim()
      .min(10, "A explicação precisa de pelo menos 10 caracteres."),
    fonte: z
      .string()
      .trim()
      .optional()
      .transform((f) => f || undefined),
    dificuldade: z.enum(["facil", "media", "dificil"], { error: "Escolha a dificuldade." }).default("media"),
  })
  .superRefine((q, ctx) => {
    if (q.tipo === "verdadeiro_falso") {
      if (q.gabarito !== "V" && q.gabarito !== "F") {
        ctx.addIssue({ code: "custom", path: ["gabarito"], message: "Em verdadeiro/falso, a resposta é V ou F." });
      }
      return;
    }
    if (!q.alternativas) {
      ctx.addIssue({ code: "custom", path: ["alternativas"], message: "Preencha as alternativas." });
      return;
    }
    const letras = q.alternativas.map((a) => a.letra);
    const repetidas = letras.filter((l, i) => letras.indexOf(l) !== i);
    if (repetidas.length) {
      ctx.addIssue({
        code: "custom",
        path: ["alternativas"],
        message: `A letra ${repetidas[0]} aparece mais de uma vez.`,
      });
    }
    if (!letras.includes(q.gabarito as (typeof LETRAS)[number])) {
      ctx.addIssue({
        code: "custom",
        path: ["gabarito"],
        message: "A resposta correta precisa ser uma das alternativas preenchidas.",
      });
    }
  })
  // V/F não guarda alternativas
  .transform((q) => (q.tipo === "verdadeiro_falso" ? { ...q, alternativas: undefined } : q));

export const ImportSchema = z.object({
  questoes: z.array(QuestaoImportSchema).min(1, "Nenhuma questão encontrada."),
});

export type QuestaoImport = z.infer<typeof QuestaoImportSchema>;

// Procedimento (manobra ou exame): nome + checklist de passos. Formulário, importação e servidor.
// Sem id nos passos: quem grava atribui (e mantém na edição).
export const PassoSchema = z.object({
  texto: z
    .string({ error: "Escreva o texto do passo." })
    .trim()
    .min(3, "Cada passo precisa de pelo menos 3 caracteres.")
    .max(300, "Cada passo pode ter no máximo 300 caracteres."),
  critico: z.boolean({ error: "“critico” precisa ser true ou false." }).default(false),
});

export const ProcedimentoSchema = z.object({
  nome: z
    .string({ error: "Escreva o nome do procedimento." })
    .trim()
    .min(3, "O nome precisa de pelo menos 3 caracteres.")
    .max(120, "O nome pode ter no máximo 120 caracteres."),
  material: z
    .array(z.string({ error: "Cada item do material é um texto." }).trim().min(1, "Há um item de material vazio."), {
      error: "O material precisa ser uma lista.",
    })
    .max(30, "Use no máximo 30 itens de material.")
    .default([]),
  passos: z
    .array(PassoSchema, { error: "Os passos precisam ser uma lista." })
    .min(2, "O procedimento precisa de pelo menos 2 passos.")
    .max(40, "Use no máximo 40 passos."),
  pontosDeAtencao: z
    .string({ error: "Escreva os pontos de atenção." })
    .trim()
    .min(10, "Os pontos de atenção precisam de pelo menos 10 caracteres."),
  fonte: z
    .string()
    .trim()
    .optional()
    .transform((f) => f || undefined),
});

export const ImportProcedimentosSchema = z.object({
  procedimentos: z.array(ProcedimentoSchema).min(1, "Nenhum procedimento encontrado."),
});

export type ProcedimentoImport = z.infer<typeof ProcedimentoSchema>;

// Formulário manual: só estas origens (notebooklm e ia vêm dos outros fluxos).
export const OrigemManualSchema = z.enum(["manual", "prova_antiga"], { error: "Escolha a origem." });
