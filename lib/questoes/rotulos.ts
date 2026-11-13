// Rótulos da interface para os enums de questões (módulo comum a servidor e cliente).
export const ROTULO_TIPO = {
  multipla_escolha: "Múltipla escolha",
  caso_clinico: "Caso clínico",
  verdadeiro_falso: "Verdadeiro ou falso",
  procedimento: "Procedimento",
} as const;

export const ROTULO_DIFICULDADE = { facil: "Fácil", media: "Média", dificil: "Difícil" } as const;

export const ROTULO_ORIGEM = {
  manual: "Manual",
  prova_antiga: "Prova antiga",
  notebooklm: "NotebookLM",
  ia: "IA",
} as const;
