import { NextRequest, NextResponse } from "next/server";

// Proxy login về backend — tránh CORS vì Client Component không gọi thẳng được
export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(
    "https://petcare-be-production.up.railway.app/api/v1/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Basic " + Buffer.from("admin:techtus@2026").toString("base64"),
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
