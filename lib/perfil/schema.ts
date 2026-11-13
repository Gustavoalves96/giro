import { z } from "zod";

export const NomeSchema = z
  .string({ error: "Digite como você quer ser chamada." })
  .trim()
  .min(1, "Digite como você quer ser chamada.")
  .max(40, "Use no máximo 40 caracteres.");

// Tempo de estudo: 5 a 60 min, de 5 em 5 (em segundos no banco e nos formulários).
export const ESTUDO_PADRAO = 600;
export const OPCOES_ESTUDO_MIN = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);

export const EstudoSegundosSchema = z.coerce
  .number({ error: "Escolha um tempo de 5 a 60 minutos." })
  .int("Escolha um tempo de 5 a 60 minutos.")
  .min(300, "Escolha um tempo de 5 a 60 minutos.")
  .max(3600, "Escolha um tempo de 5 a 60 minutos.")
  .multipleOf(300, "Escolha um tempo de 5 em 5 minutos.");
