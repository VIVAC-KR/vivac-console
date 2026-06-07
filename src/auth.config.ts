import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [
    Google({
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
