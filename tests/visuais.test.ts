import { describe, expect, it } from "vitest";
import { medalhaPorId } from "@/lib/domain/conquistas";
import { contarDesbloqueios, ESTILOS_ROLETA, estiloRoletaDe, liberado, MOLDURAS, molduraDe, temNovidade, textoLibera } from "@/lib/domain/visuais";
import { xpParaNivel } from "@/lib/domain/nivel";

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

describe("contarDesbloqueios / temNovidade", () => {
  const nenhuma = new Set<string>();
  it("conta nova não tem nada desbloqueado", () => {
    expect(contarDesbloqueios(1, nenhuma)).toBe(0);
    expect(temNovidade(0, nenhuma, 0)).toBe(false);
  });
  it("nível 2 libera a moldura Estetoscópio; nível 4, o estilo e o título Ciclo clínico", () => {
    expect(contarDesbloqueios(2, nenhuma)).toBe(1);
    expect(contarDesbloqueios(4, nenhuma)).toBe(3);
  });
  it("medalha conta ela e o visual que ela libera", () => {
    expect(contarDesbloqueios(1, new Set(["ofensiva-3"]))).toBe(2);
  });
  it("novidade só quando passa do que ela já viu", () => {
    expect(temNovidade(xpParaNivel(2), nenhuma, 0)).toBe(true);
    expect(temNovidade(xpParaNivel(2), nenhuma, 1)).toBe(false);
    expect(temNovidade(xpParaNivel(2), new Set(["primeiro-giro"]), 1)).toBe(true);
  });
});
