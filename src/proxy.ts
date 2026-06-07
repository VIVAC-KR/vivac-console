import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
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
