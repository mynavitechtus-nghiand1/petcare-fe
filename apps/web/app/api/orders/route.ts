import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = "https://petcare-be-production.up.railway.app";

export async function GET() {
  const store = await cookies();
  const token = store.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${BACKEND}/api/v1/orders`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
