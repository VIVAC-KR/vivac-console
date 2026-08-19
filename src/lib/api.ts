import { notFound, redirect } from "next/navigation";
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

/**
 * backend 호출은 전부 여기를 지난다. server action은 proxy(middleware)를 거치지 않고도
 * 호출 가능한 공개 엔드포인트이므로, 인증 검사를 이 단일 통로에 둔다.
 */
async function authHeaders() {
  const token = await getAccessToken();
  if (!token) throw new ApiError(401, "인증이 필요합니다.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${getBase()}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, `API ${res.status}: ${body}`);
  }
  return res;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return (await request(path, init)).json() as Promise<T>;
}

/** 404만 notFound()로, 나머지 실패는 그대로 던진다 (backend 장애를 "없는 페이지"로 감추지 않기 위해). */
export async function apiFetchOr404<T>(path: string): Promise<T> {
  try {
    return await apiFetch<T>(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
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
  const res = await request(`${path}?${q}`);
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
  return status ? `요청 실패 (${status}) ${message}`.trim() : `요청 실패 — ${message}`;
}

/**
 * 쓰기 요청 공통. 성공하면 Response, 실패하면 사람이 읽을 에러 메시지를 돌려준다.
 * 네트워크 단절도 여기서 문자열로 흡수한다 — server action이 throw하면 화면 전체가
 * error boundary로 날아가기 때문.
 */
async function send(
  method: string,
  path: string,
  data?: Record<string, unknown>
): Promise<Response | string> {
  try {
    const res = await fetch(`${getBase()}${path}`, {
      method,
      headers: await authHeaders(),
      body: data && JSON.stringify(data),
    });
    if (res.ok) return res;
    return parseErrorBody(res.status, await res.text().catch(() => ""));
  } catch (err) {
    if (err instanceof ApiError) return parseErrorBody(err.status, err.message);
    return parseErrorBody(0, err instanceof Error ? err.message : String(err));
  }
}

const errorOf = (r: Response | string) => (typeof r === "string" ? r : null);

/** PATCH — 성공 시 null, 실패 시 사람이 읽을 에러 메시지 */
export const apiMutate = async (path: string, data: Record<string, unknown>) =>
  errorOf(await send("PATCH", path, data));

/** POST — 성공 시 null, 실패 시 사람이 읽을 에러 메시지 */
export const apiCreate = async (path: string, data: Record<string, unknown>) =>
  errorOf(await send("POST", path, data));

/** DELETE — 성공 시 null, 실패 시 사람이 읽을 에러 메시지 */
export const apiDelete = async (path: string) => errorOf(await send("DELETE", path));

async function sendWithResult<T>(
  method: string,
  path: string,
  data: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const res = await send(method, path, data);
  if (typeof res === "string") return { data: null, error: res };
  return { data: (await res.json()) as T, error: null };
}

/** POST — 생성된 리소스의 응답 바디가 필요한 경우 */
export const apiCreateWithResult = <T>(path: string, data: Record<string, unknown>) =>
  sendWithResult<T>("POST", path, data);

/** PATCH — 응답 바디가 필요한 경우 (예: job_id를 돌려주는 비동기 작업 큐잉) */
export const apiMutateWithResult = <T>(path: string, data: Record<string, unknown>) =>
  sendWithResult<T>("PATCH", path, data);

/** server action 공통 마무리 — 결과를 쿼리스트링에 실어 원래 화면으로 돌려보낸다. */
export function redirectResult(base: string, error: string | null): never {
  const sep = base.includes("?") ? "&" : "?";
  redirect(error ? `${base}${sep}error=${encodeURIComponent(error)}` : `${base}${sep}saved=1`);
}
