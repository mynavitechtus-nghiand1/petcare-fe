import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password || password !== process.env.ADMIN_UI_PASSWORD) {
    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin-session", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
