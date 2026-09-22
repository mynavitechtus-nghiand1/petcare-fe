import { NextResponse } from "next/server";

const BACKEND = "https://petcare-be-production.up.railway.app";
const BASIC = process.env.API_BASIC_AUTH!;

export async function GET() {
  const res = await fetch(`${BACKEND}/api/v1/categories`, {
    headers: { Accept: "application/json", Authorization: BASIC },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
