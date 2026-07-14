import { getAccessToken } from "@/auth";

function getBase(): string {
  const base = process.env.API_BASE_URL;
  if (!base) throw new Error("API_BASE_URL is not set");
  return base;
}

/** status를 담은 API 에러 — 호출부가 404 vs 그 외를 구분할 수 있게 한다. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function authHeaders() {
  const token = await getAccessToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? ""}`,
  };
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, `API ${res.status}: ${body}`);
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
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const headers = await authHeaders();
  const res = await fetch(`${getBase()}${path}?${q}`, { headers, cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, `API ${res.status}: ${body}`);
  }
  const total = Number(res.headers.get("x-total-count") ?? 0);
  const data = (await res.json()) as T[];
  return { data, total };
}

/** FastAPI HTTPException({"detail": "..."}) 및 422 validation error(detail 배열)를 파싱한다. */
function parseErrorBody(status: number, body: string): string {
  let message = body;
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed.detail === "string") {
      message = parsed.detail;
    } else if (Array.isArray(parsed.detail)) {
      message = parsed.detail
        .map((d: { loc?: unknown[]; msg?: string }) =>
          d.msg ? `${(d.loc ?? []).join(".")}: ${d.msg}` : JSON.stringify(d)
        )
        .join("; ");
    }
  } catch {
    // 텍스트 그대로 표시
  }
  return `저장 실패 (${status}) ${message}`.trim();
}

/** PATCH — 저장 결과: 성공 시 null, 실패 시 사람이 읽을 에러 메시지 */
export async function apiMutate(
  path: string,
  data: Record<string, unknown>
): Promise<string | null> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  if (res.ok) return null;
  const body = await res.text().catch(() => "");
  return parseErrorBody(res.status, body);
}

/** POST — 생성 결과: 성공 시 null, 실패 시 사람이 읽을 에러 메시지 */
export async function apiCreate(
  path: string,
  data: Record<string, unknown>
): Promise<string | null> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  if (res.ok) return null;
  const body = await res.text().catch(() => "");
  return parseErrorBody(res.status, body);
}

/** DELETE — 삭제 결과: 성공 시 null, 실패 시 사람이 읽을 에러 메시지 */
export async function apiDelete(path: string): Promise<string | null> {
  const res = await fetch(`${getBase()}${path}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (res.ok) return null;
  const body = await res.text().catch(() => "");
  return parseErrorBody(res.status, body);
}
