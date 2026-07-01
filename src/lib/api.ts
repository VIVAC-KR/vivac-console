import { redirect } from "next/navigation";
import { auth } from "@/auth";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

async function authHeaders() {
  const session = await auth();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken ?? ""}`,
  };
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...init?.headers },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/login");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** GET list — returns { data, total } parsed from X-Total-Count header */
export async function apiList<T>(
  path: string,
  params: Record<string, string | number | undefined>
): Promise<{ data: T[]; total: number }> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, String(v));
  }
  const headers = await authHeaders();
  const res = await fetch(`${BASE}${path}?${q}`, { headers, cache: "no-store" });
  if (res.status === 401) redirect("/login");
  if (!res.ok) throw new Error(`API ${res.status}`);
  const total = Number(res.headers.get("x-total-count") ?? 0);
  const data = (await res.json()) as T[];
  return { data, total };
}
