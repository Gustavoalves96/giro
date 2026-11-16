import { describe, expect, it } from "vitest";
import { medalhaPorId } from "@/lib/domain/conquistas";
import { ESTILOS_ROLETA, estiloRoletaDe, liberado, MOLDURAS, molduraDe, textoLibera } from "@/lib/domain/visuais";

describe("liberado", () => {
  const nenhuma = new Set<string>();
  it("livre, por nível e por medalha", () => {
    expect(liberado(null, 1, nenhuma)).toBe(true);
    expect(liberado({ nivel: 4 }, 3, nenhuma)).toBe(false);
    expect(liberado({ nivel: 4 }, 4, nenhuma)).toBe(true);
    expect(liberado({ medalha: "ofensiva-7" }, 50, nenhuma)).toBe(false);
    expect(liberado({ medalha: "ofensiva-7" }, 1, new Set(["ofensiva-7"]))).toBe(true);
  });
});

describe("listas", () => {
  it("o padrão é livre, ids únicos e toda medalha citada existe", () => {
    for (const lista of [ESTILOS_ROLETA, MOLDURAS]) {
      expect(lista[0].libera).toBeNull();
      expect(new Set(lista.map((v) => v.id)).size).toBe(lista.length);
      for (const v of lista) if (v.libera && "medalha" in v.libera) expect(medalhaPorId(v.libera.medalha)).toBeDefined();
    }
  });

  it("id salvo desconhecido ou vazio cai no padrão", () => {
    expect(estiloRoletaDe(null)).toBe("classico");
    expect(estiloRoletaDe("nao-existe")).toBe("classico");
    expect(estiloRoletaDe("ouro")).toBe("ouro");
    expect(molduraDe(undefined)).toBe("nenhuma");
  });

  it("texto de como liberar", () => {
    expect(textoLibera({ nivel: 4 })).toBe("Libera no nível 4 (Ciclo clínico)");
    expect(textoLibera({ medalha: "ofensiva-7" })).toBe("Libera com a medalha “Uma semana”");
  });
});
