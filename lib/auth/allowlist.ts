// Lista vazia ou ausente = ninguém entra.
export function parseAllowlist(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isEmailAllowed(email: string | null | undefined, raw: string | undefined): boolean {
  if (!email) return false;
  return parseAllowlist(raw).has(email.trim().toLowerCase());
}
