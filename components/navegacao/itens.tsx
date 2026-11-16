"use client";

import { BookOpen, CalendarDays, ChartColumn, CircleUser, Disc3, House, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const DESTINOS = [
  { href: "/", rotulo: "Início", Icone: House },
  { href: "/roleta", rotulo: "Roleta", Icone: Disc3 },
  { href: "/revisao", rotulo: "Revisão", Icone: RotateCcw },
  { href: "/disciplinas", rotulo: "Disciplinas", Icone: BookOpen },
  { href: "/estatisticas", rotulo: "Estatísticas", Icone: ChartColumn },
  // celular: 5 abas, Provas e Recompensas saem da barra (Recompensas abre pelo chip do nível no Início)
  { href: "/provas", rotulo: "Provas", Icone: CalendarDays, soTelaGrande: true },
  { href: "/recompensas", rotulo: "Recompensas", Icone: Trophy, soTelaGrande: true },
] as const;

const PERFIL = { href: "/perfil", rotulo: "Meu perfil", Icone: CircleUser };

function estaAtivo(href: string, pathname: string | null) {
  if (!pathname) return false;
  // tópico é filho de disciplina, embora a rota fique em /topicos
  if (href === "/disciplinas" && pathname.startsWith("/topicos/")) return true;
  // o caderno de erros abre pela Revisão
  if (href === "/revisao" && (pathname === "/erros" || pathname.startsWith("/erros/"))) return true;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

// Celular: aba (ícone sobre rótulo) · iPad: trilho (ícone sobre rótulo) · notebook: rótulo ao lado
const ITEM =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[12px] font-bold max-[359px]:px-0 max-[359px]:text-[11px] text-ink3 transition-colors hover:text-ink " +
  "md:h-16 md:w-20 md:flex-none " +
  "xl:h-12 xl:w-full xl:flex-row xl:justify-start xl:gap-3 xl:px-4 xl:text-base";
const ATIVO = "bg-ac/12 text-acink hover:text-acink";

type Item = { href: string; rotulo: string; Icone: typeof House; soTelaGrande?: boolean };

function LinkNav({ item, pathname, className }: { item: Item; pathname: string | null; className?: string }) {
  const ativo = estaAtivo(item.href, pathname);
  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={cn(ITEM, ativo && ATIVO, item.soTelaGrande && "max-md:hidden", className)}
    >
      <item.Icone className="size-6 shrink-0" aria-hidden />
      <span>{item.rotulo}</span>
    </Link>
  );
}

/** Lista dos 7 destinos. `pathname` null = sem destaque (fallback do Suspense). */
export function ListaDestinos({ pathname }: { pathname: string | null }) {
  return DESTINOS.map((d) => <LinkNav key={d.href} item={d} pathname={pathname} />);
}

export function ListaDestinosAtiva() {
  return <ListaDestinos pathname={usePathname()} />;
}

/** Meu perfil no rodapé do trilho / barra lateral (md+). */
export function LinkPerfil({ pathname }: { pathname: string | null }) {
  return <LinkNav item={PERFIL} pathname={pathname} className="max-md:hidden md:mt-auto" />;
}

export function LinkPerfilAtivo() {
  return <LinkPerfil pathname={usePathname()} />;
}
