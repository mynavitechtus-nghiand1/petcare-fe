import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = "https://petcare-be-production.up.railway.app";
const BASIC = process.env.API_BASIC_AUTH!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

async function loginAdmin() {
  const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: BASIC },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const d = await res.json();
  if (!d.data?.access_token) return null;
  return { access: d.data.access_token as string, refresh: d.data.refresh_token as string };
}

async function refreshAdmin(refreshToken: string) {
  const res = await fetch(`${BACKEND}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${refreshToken}` },
  });
  const d = await res.json();
  if (!d.success || !d.data?.access_token) return null;
  return { access: d.data.access_token as string, refresh: d.data.refresh_token as string };
}

function applyTokenCookies(response: NextResponse, creds: { access: string; refresh: string }) {
  response.cookies.set("admin-token", creds.access, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 14,
  });
  response.cookies.set("admin-refresh-token", creds.refresh, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}

async function handler(req: NextRequest, pathSegments: string[]) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("admin-token")?.value ?? null;
  let newCreds: { access: string; refresh: string } | null = null;

  if (!accessToken) {
    const refreshToken = cookieStore.get("admin-refresh-token")?.value ?? null;
    if (refreshToken) newCreds = await refreshAdmin(refreshToken);
    if (!newCreds) newCreds = await loginAdmin();
    if (!newCreds) return NextResponse.json({ error: "Admin auth failed" }, { status: 503 });
    accessToken = newCreds.access;
  }

  const backendUrl = new URL(`/api/v1/admin/${pathSegments.join("/")}`, BACKEND);
  req.nextUrl.searchParams.forEach((val, key) => backendUrl.searchParams.set(key, val));

  const hasBody = req.method !== "GET" && req.method !== "DELETE";
  const body = hasBody ? await req.text() : undefined;

  const makeRequest = (token: string) =>
    fetch(backendUrl.toString(), {
      method: req.method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body } : {}),
    });

  let backendRes = await makeRequest(accessToken);

  if (backendRes.status === 401) {
    const refreshToken = cookieStore.get("admin-refresh-token")?.value ?? null;
    newCreds = refreshToken ? await refreshAdmin(refreshToken) : null;
    if (!newCreds) newCreds = await loginAdmin();
    if (!newCreds) return NextResponse.json({ error: "Admin auth failed" }, { status: 503 });
    backendRes = await makeRequest(newCreds.access);
  }

  const data = await backendRes.json();
  const response = NextResponse.json(data, { status: backendRes.status });
  if (newCreds) applyTokenCookies(response, newCreds);
  return response;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handler(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handler(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handler(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handler(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handler(req, (await params).path);
}
