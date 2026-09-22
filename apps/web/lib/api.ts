const BASE = process.env.NEXT_PUBLIC_API_URL!;
const BASIC = process.env.API_BASIC_AUTH!;

// Header dùng chung cho mọi request — Basic Auth cho Railway
export const baseHeaders = {
  Accept: "application/json",
  Authorization: BASIC,
};

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...baseHeaders, ...init?.headers },
  });
}
