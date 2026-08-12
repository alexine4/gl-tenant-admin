import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// A separate, edge-safe NextAuth instance built only from the shared,
// Node-free half of the config -- middleware runs on the Edge Runtime,
// which can't load auth.ts's Prisma/bcrypt-backed Credentials provider.
const { auth } = NextAuth(authConfig);

const API_PREFIXES = ["/tenant/branding", "/tenant/documents", "/tenant/analytics", "/tenant/users"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth);
  const isApiPath = API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isLoggedIn && (pathname.startsWith("/console") || isApiPath)) {
    if (isApiPath) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/console", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/console/:path*",
    "/login",
    "/tenant/branding/:path*",
    "/tenant/documents/:path*",
    "/tenant/analytics/:path*",
    "/tenant/users/:path*",
  ],
};
