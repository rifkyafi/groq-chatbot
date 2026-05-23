// src/middleware.js
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const session = request.auth;

  // Public routes yang tidak perlu autentikasi
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // API routes autentikasi publik
  const isAuthApiRoute = request.nextUrl.pathname.startsWith("/api/auth");

  if (isPublicRoute || isAuthApiRoute) {
    // Jika sudah login dan akses /login, redirect ke /
    if (session && request.nextUrl.pathname.startsWith("/login")) {
      return Response.redirect(new URL("/", request.url));
    }
    return null;
  }

  // Routes yang memerlukan autentikasi
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};