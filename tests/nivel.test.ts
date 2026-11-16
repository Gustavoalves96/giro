import { describe, expect, it } from "vitest";
import { nivel, TITULOS, xpParaNivel } from "@/lib/domain/nivel";

describe("nivel", () => {
  it("nos limites: 80 XP para o 2, 240 para o 3", () => {
    expect(nivel(0)).toEqual({ nivel: 1, titulo: "Ciclo básico", xpNoNivel: 0, xpDoNivel: 80 });
    expect(nivel(79).nivel).toBe(1);
    expect(nivel(80)).toEqual({ nivel: 2, titulo: "Ciclo básico", xpNoNivel: 0, xpDoNivel: 160 });
    expect(nivel(239)).toMatchObject({ nivel: 2, xpNoNivel: 159 });
    expect(nivel(240)).toMatchObject({ nivel: 3, xpNoNivel: 0, xpDoNivel: 240 });
  });

  it("todo limite de nível cai exato (sem erro de raiz)", () => {
    for (let n = 1; n <= 200; n++) {
      expect(nivel(xpParaNivel(n)).nivel).toBe(n);
      expect(nivel(xpParaNivel(n) - 1).nivel).toBe(Math.max(1, n - 1));
    }
  });

  it("troca de título no nível da lista", () => {
    expect(nivel(xpParaNivel(4) - 1).titulo).toBe("Ciclo básico");
    expect(nivel(xpParaNivel(4)).titulo).toBe("Ciclo clínico");
    expect(nivel(xpParaNivel(40)).titulo).toBe("Referência");
    expect(xpParaNivel(42)).toBe(68_880);
    expect(nivel(68_880).titulo).toBe("Dr/a. Aura");
  });

  it("XP enorme continua no último título; negativo vira nível 1", () => {
    expect(nivel(10_000_000).titulo).toBe(TITULOS.at(-1)!.titulo);
    expect(nivel(-5).nivel).toBe(1);
  });
});
