import { NextRequest, NextResponse } from "next/server";

// Danh sách route cần đăng nhập mới vào được
const PROTECTED = ["/orders", "/profile", "/checkout", "/cart", "/checkout"];

// Danh sách route chỉ dành cho chưa đăng nhập (đã login thì redirect về home)
const AUTH_ONLY = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((path) => pathname.startsWith(path));
  const isAuthOnly = AUTH_ONLY.some((path) => pathname.startsWith(path));

  // Chưa login, cố vào trang protected → đá về login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname); // nhớ trang muốn vào để redirect lại sau
    return NextResponse.redirect(loginUrl);
  }

  // Đã login, vào lại /login → đá về home
  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Chỉ chạy middleware trên các route này, bỏ qua _next/static, favicon...
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
