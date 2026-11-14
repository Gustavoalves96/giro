import { redirect } from "next/navigation";

// Provisório até a sessão 14 (Início): a roleta é a porta de entrada.
export default function Home() {
  redirect("/roleta");
}
