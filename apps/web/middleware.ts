import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/orders", "/profile", "/checkout", "/cart", "/checkout"];
const AUTH_ONLY = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const adminSession = request.cookies.get("admin-session")?.value;
  const { pathname } = request.nextUrl;

  // Admin route protection — tất cả /admin/* trừ /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!adminSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  const isProtected = PROTECTED.some((path) => pathname.startsWith(path));
  const isAuthOnly = AUTH_ONLY.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Chỉ chạy middleware trên các route này, bỏ qua _next/static, favicon...
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
