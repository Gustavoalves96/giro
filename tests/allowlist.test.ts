import { describe, expect, it } from "vitest";
import { isEmailAllowed, parseAllowlist } from "@/lib/auth/allowlist";

describe("allowlist", () => {
  it("normaliza maiúsculas e espaços, ignora itens vazios", () => {
    expect([...parseAllowlist("  Ana@Gmail.com , ,bia@x.com,")]).toEqual(["ana@gmail.com", "bia@x.com"]);
  });

  it("aceita e-mail da lista sem diferenciar maiúsculas nem espaços", () => {
    expect(isEmailAllowed(" ANA@gmail.COM ", "ana@gmail.com, bia@x.com")).toBe(true);
    expect(isEmailAllowed("bia@x.com", "ana@gmail.com, bia@x.com")).toBe(true);
  });

  it("recusa e-mail fora da lista", () => {
    expect(isEmailAllowed("outra@gmail.com", "ana@gmail.com")).toBe(false);
  });

  it("lista vazia ou ausente → ninguém entra", () => {
    expect(isEmailAllowed("ana@gmail.com", "")).toBe(false);
    expect(isEmailAllowed("ana@gmail.com", " , ")).toBe(false);
    expect(isEmailAllowed("ana@gmail.com", undefined)).toBe(false);
  });

  it("sem e-mail → recusa", () => {
    expect(isEmailAllowed(null, "ana@gmail.com")).toBe(false);
    expect(isEmailAllowed("", "ana@gmail.com")).toBe(false);
  });
});
