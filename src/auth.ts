import NextAuth, { type DefaultSession } from "next-auth";
import type {} from "next-auth/jwt";
import authConfig from "@/auth.config";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    expired?: boolean;
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
    accessTokenExpires?: number;
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

/** JWT의 exp(초)를 밀리초로 반환. 검증 없이 payload만 디코드한다. */
function backendTokenExpiry(jwt: string): number {
  try {
    const b64 = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
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
        backendAccessTokenExpires: backendTokenExpiry(data.access_token),
      });
      return true;
    },
  },
});
