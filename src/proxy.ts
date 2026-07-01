import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  // 백엔드 토큰이 만료된 세션은 로그아웃으로 취급 (session 콜백이 expired 세팅)
  const isLoggedIn = !!req.auth && !req.auth.expired;
  const path = nextUrl.pathname;

  if (path.startsWith("/api/auth")) return;

  if (path === "/login") {
    if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.svg|.*\\.png).*)"],
};
