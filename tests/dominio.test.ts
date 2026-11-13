import { describe, expect, it } from "vitest";
import { calcularDominio } from "@/lib/domain/dominio";

describe("calcularDominio", () => {
  it("sem respostas = 0", () => {
    expect(calcularDominio([])).toBe(0);
  });
  it("uma resposta certa = 100, uma errada = 0", () => {
    expect(calcularDominio([true])).toBe(100);
    expect(calcularDominio([false])).toBe(0);
  });
  it("decaimento: a mais recente pesa mais", () => {
    // certa agora, errada antes: 1 / (1 + 0,9)
    expect(calcularDominio([true, false])).toBeCloseTo(100 / 1.9, 10);
    expect(calcularDominio([false, true])).toBeCloseTo(90 / 1.9, 10);
    // C, E, C → (1 + 0,81) / (1 + 0,9 + 0,81)
    expect(calcularDominio([true, false, true])).toBeCloseTo((181 / 2.71), 10);
  });
  it("só as 20 últimas contam", () => {
    const vinteCertas = Array(20).fill(true);
    expect(calcularDominio([...vinteCertas, ...Array(30).fill(false)])).toBe(100);
    expect(calcularDominio([...Array(20).fill(false), true])).toBe(0);
  });
});
