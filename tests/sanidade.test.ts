import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("vitest", () => {
  it("roda e resolve o alias @/", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
