import { describe, expect, it } from "vitest";
import { EstudoSegundosSchema, NomeSchema, OPCOES_ESTUDO_MIN } from "@/lib/perfil/schema";

describe("EstudoSegundosSchema", () => {
  it("aceita 5 a 60 min de 5 em 5 (também vindo de formulário/URL como texto)", () => {
    expect(OPCOES_ESTUDO_MIN.every((m) => EstudoSegundosSchema.safeParse(m * 60).success)).toBe(true);
    expect(OPCOES_ESTUDO_MIN).toHaveLength(12);
    expect(EstudoSegundosSchema.parse("900")).toBe(900);
  });
  it("recusa fora da faixa, fora do passo e lixo", () => {
    for (const v of [0, 240, 3900, 330, 600.5, "abc", "", null]) {
      expect(EstudoSegundosSchema.safeParse(v).success, String(v)).toBe(false);
    }
  });
});

describe("NomeSchema", () => {
  it("recusa vazio e só espaços", () => {
    expect(NomeSchema.safeParse("").success).toBe(false);
    expect(NomeSchema.safeParse("   ").success).toBe(false);
  });

  it("recusa 41 caracteres e aceita 40", () => {
    expect(NomeSchema.safeParse("a".repeat(41)).success).toBe(false);
    expect(NomeSchema.safeParse("a".repeat(40)).success).toBe(true);
  });

  it("apara espaços antes de contar", () => {
    expect(NomeSchema.parse("  Ana  ")).toBe("Ana");
    expect(NomeSchema.safeParse(` ${"a".repeat(40)} `).success).toBe(true);
  });

  it("recusa campo ausente com mensagem em português", () => {
    const r = NomeSchema.safeParse(null);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe("Digite como você quer ser chamada.");
  });
});
