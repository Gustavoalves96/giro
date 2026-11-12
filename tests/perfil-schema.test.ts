import { describe, expect, it } from "vitest";
import { NomeSchema } from "@/lib/perfil/schema";

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
