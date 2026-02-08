import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "exora-dev-secret-min-32-characters-long"
);

const COOKIE_NAME = "exora_session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isLogin = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isLogin) {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = payload.role as string;
        if (role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.redirect(new URL("/app", request.url));
      } catch {
        // invalid token, allow login page
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/app", request.url));
    }

    if (!isAdminRoute && pathname.startsWith("/app") && role === "admin") {
      // Admin can still access /app if they navigate there
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/app/:path*", "/login"],
};
