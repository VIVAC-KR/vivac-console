import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  // 백엔드 토큰이 만료된 세션은 로그아웃으로 취급 (session 콜백이 expired 세팅)
  const isLoggedIn = !!req.auth && !req.auth.expired;

  if (nextUrl.pathname === "/login") {
    if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  // 확장자는 반드시 경로 "끝"에서만 제외한다. `.*\.png`처럼 쓰면
  // /spot-groups/x.png/edit 같은 경로가 통째로 proxy를 건너뛴다.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
