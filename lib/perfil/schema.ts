import { z } from "zod";

export const NomeSchema = z
  .string({ error: "Digite como você quer ser chamada." })
  .trim()
  .min(1, "Digite como você quer ser chamada.")
  .max(40, "Use no máximo 40 caracteres.");
