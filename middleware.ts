import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev_fallback_not_for_production"
);

// Paths that require ADMIN role (both page routes and API routes)
const ADMIN_PATHS = ["/admin", "/api/admin"];
// Paths that require any authenticated session
const AUTH_PATHS = ["/teacher", "/student", "/parent", "/api/teacher", "/api/student", "/api/parent"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPath = startsWithAny(pathname, ADMIN_PATHS);
  const isAuthPath = startsWithAny(pathname, AUTH_PATHS);

  if (!isAdminPath && !isAuthPath) return NextResponse.next();

  // Read JWT from cookie
  const token = req.cookies.get("eta_session")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Admin paths: ADMIN role only
    if (isAdminPath && role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Redirect non-admins to their own portal
      const portalMap: Record<string, string> = {
        TEACHER: "/teacher",
        STUDENT: "/student",
        PARENT: "/parent",
      };
      return NextResponse.redirect(new URL(portalMap[role] ?? "/login", req.url));
    }

    // Portal paths: role must match prefix
    if (pathname.startsWith("/teacher") || pathname.startsWith("/api/teacher")) {
      if (role !== "TEACHER" && role !== "ADMIN") {
        if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
    if (pathname.startsWith("/student") || pathname.startsWith("/api/student")) {
      if (role !== "STUDENT" && role !== "ADMIN") {
        if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
    if (pathname.startsWith("/parent") || pathname.startsWith("/api/parent")) {
      if (role !== "PARENT" && role !== "ADMIN") {
        if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/api/admin/:path*",
    "/api/teacher/:path*",
    "/api/student/:path*",
    "/api/parent/:path*",
  ],
};
