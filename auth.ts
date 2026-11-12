import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "@/lib/auth/allowlist";

// Lê AUTH_SECRET, AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET do ambiente.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  // recusa no signIn → /login?error=AccessDenied
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    signIn({ profile }) {
      return profile?.email_verified === true && isEmailAllowed(profile.email, process.env.ALLOWED_EMAILS);
    },
  },
});
