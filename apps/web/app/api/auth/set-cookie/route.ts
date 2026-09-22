import { NextRequest, NextResponse } from "next/server";

// Tại sao phải set cookie từ server?
// httpOnly cookie không đọc được bằng JS → an toàn hơn localStorage
// Client không thể tự set httpOnly cookie → phải nhờ server
export async function POST(request: NextRequest) {
  const { token } = await request.json();

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth-token", token, {
    httpOnly: true,   // JS không đọc được → chặn XSS
    secure: process.env.NODE_ENV === "production", // chỉ HTTPS trên production
    maxAge: 60 * 60, // 1 giờ (giống expiresInMins của DummyJSON)
    path: "/",
  });

  return response;
}
