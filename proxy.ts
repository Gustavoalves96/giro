// Next 16: "middleware.ts" foi renomeado para "proxy.ts".
// Checagem otimista; toda Server Action de mutação também chama requireUser().
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((req) => {
  const naLogin = req.nextUrl.pathname === "/login";
  if (!req.auth && !naLogin) return NextResponse.redirect(new URL("/login", req.nextUrl));
  if (req.auth && naLogin) return NextResponse.redirect(new URL("/", req.nextUrl));
});

export const config = {
  // tudo, exceto /api/auth/*, arquivos do Next, assets estáticos, o manifest e o ícone da tela de início
  // (o iPad busca os dois sem passar pelo login)
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
