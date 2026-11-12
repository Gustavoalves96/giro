import { auth } from "@/auth";
import { isEmailAllowed } from "@/lib/auth/allowlist";

// Chamar no início de toda Server Action de mutação.
// Rechecagem da allowlist: tirar um e-mail do ALLOWED_EMAILS corta também sessões já abertas.
export async function requireUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isEmailAllowed(email, process.env.ALLOWED_EMAILS)) {
    throw new Error("Não autorizado.");
  }
  return session.user;
}
