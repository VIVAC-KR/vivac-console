import NextAuth, { type DefaultSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import authConfig from "@/auth.config";

export type StaffRole = "staff" | "manager" | "superuser";

declare module "next-auth" {
  interface Session {
    expired?: boolean;
    user: {
      id?: string;
      isStaff?: boolean;
      staffRole?: StaffRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    userId?: string;
    isStaff?: boolean;
    staffRole?: StaffRole;
    accessTokenExpires?: number;
  }
}

function apiBaseUrl(): string {
  const base = process.env.API_BASE_URL;
  if (!base) throw new Error("API_BASE_URL is not set");
  return base;
}

type BackendAuthResponse = {
  access_token: string;
  user: {
    id: number | string;
    email: string;
    name?: string;
    is_staff: boolean;
    staff_role: StaffRole;
  };
};

/** JWT의 exp(초)를 밀리초로 반환. 검증 없이 payload만 디코드한다. */
function backendTokenExpiry(jwt: string): number {
  try {
    const { exp } = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
    return typeof exp === "number" ? exp * 1000 : 0;
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

      let data: BackendAuthResponse;
      try {
        const res = await fetch(`${apiBaseUrl()}/admin/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: account.id_token }),
        });
        if (!res.ok) return false;
        data = (await res.json()) as BackendAuthResponse;
      } catch (err) {
        // 조용히 false를 돌려주면 "Configuration" 에러만 남아 원인 추적이 불가능하다.
        console.error("[auth] backend google exchange failed", err);
        return false;
      }
      if (!data.user?.is_staff) return false;

      Object.assign(user, {
        backendAccessToken: data.access_token,
        backendUserId: String(data.user.id),
        isStaff: true,
        staffRole: data.user.staff_role,
        backendAccessTokenExpires: backendTokenExpiry(data.access_token),
      });
      return true;
    },
  },
});

/**
 * backend accessToken을 JWT 쿠키에서 직접 decode해서 반환한다.
 * session()이 반환하는 값은 /api/auth/session으로 브라우저에 노출되므로
 * accessToken은 session에 절대 넣지 않고 이 헬퍼로만 서버에서 읽는다.
 */
export async function getAccessToken(): Promise<string | undefined> {
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.AUTH_URL?.startsWith("https://") ?? false,
  });
  return token?.accessToken;
}
