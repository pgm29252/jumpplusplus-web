import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production",
);

const PUBLIC_PATHS = ["/"];
const AUTH_PATHS = ["/auth/sign-in", "/auth/sign-up"];
const PROTECTED_PREFIX = "/dashboard";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public landing path
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  // Redirect authenticated users away from auth pages
  if (AUTH_PATHS.includes(pathname)) {
    const token = req.cookies.get("token")?.value;

    if (!token) return NextResponse.next();

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch {
      const res = NextResponse.next();
      res.cookies.delete("token");
      return res;
    }
  }

  // Protect /dashboard and all sub-routes
  if (pathname.startsWith(PROTECTED_PREFIX)) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(
        new URL(
          `/auth/sign-in?redirect=${encodeURIComponent(pathname)}`,
          req.url,
        ),
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const headers = new Headers(req.headers);
      headers.set("x-user-id", payload.sub as string);
      headers.set("x-user-role", payload.role as string);
      return NextResponse.next({ request: { headers } });
    } catch {
      const res = NextResponse.redirect(new URL("/auth/sign-in", req.url));
      res.cookies.delete("token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
