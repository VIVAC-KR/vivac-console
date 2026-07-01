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
  // 쿠키 수명을 어드민 토큰(8h)과 맞춰 세션이 토큰보다 오래 살아남지 않게 한다.
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & {
          backendAccessToken?: string;
          backendUserId?: string;
          isStaff?: boolean;
          backendAccessTokenExpires?: number;
        };
        token.accessToken = u.backendAccessToken;
        token.userId = u.backendUserId;
        token.isStaff = u.isStaff;
        token.accessTokenExpires = u.backendAccessTokenExpires;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.userId ?? session.user.id;
      session.user.isStaff = token.isStaff;
      // 백엔드 토큰이 만료됐으면 세션도 만료로 표시 (proxy가 로그아웃 처리)
      session.expired =
        !token.accessTokenExpires || Date.now() >= token.accessTokenExpires;
      return session;
    },
  },
} satisfies NextAuthConfig;
