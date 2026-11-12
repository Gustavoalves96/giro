"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Rótulo via classe .dark, para não divergir entre servidor e cliente
  return (
    <Button variant="secondary" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      <Sun className="dark:hidden" aria-hidden />
      <Moon className="hidden dark:block" aria-hidden />
      <span className="dark:hidden">Tema escuro</span>
      <span className="hidden dark:inline">Tema claro</span>
    </Button>
  );
}
