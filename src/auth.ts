import NextAuth, { type DefaultSession } from "next-auth";
import type {} from "next-auth/jwt";
import authConfig from "@/auth.config";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      isStaff?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    userId?: string;
    isStaff?: boolean;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type BackendAuthResponse = {
  access_token: string;
  user: {
    id: number | string;
    email: string;
    name?: string;
    is_staff: boolean;
  };
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !account.id_token) return false;

      const res = await fetch(`${API_BASE_URL}/admin/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: account.id_token }),
      });

      if (!res.ok) return false;

      const data = (await res.json()) as BackendAuthResponse;
      if (!data.user?.is_staff) return false;

      Object.assign(user, {
        backendAccessToken: data.access_token,
        backendUserId: String(data.user.id),
        isStaff: true,
      });
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & {
          backendAccessToken?: string;
          backendUserId?: string;
          isStaff?: boolean;
        };
        token.accessToken = u.backendAccessToken;
        token.userId = u.backendUserId;
        token.isStaff = u.isStaff;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.userId ?? session.user.id;
      session.user.isStaff = token.isStaff;
      return session;
    },
  },
});
