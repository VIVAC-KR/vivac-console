export const PAGE_SIZE = 25;

/** 목록 페이지 공통 — searchParams 정규화 + 정렬/페이지 링크 생성. */
export function listQuery(
  raw: Record<string, string | string[] | undefined>,
  defaultSort = "updated_at"
) {
  // 같은 키가 반복되면 Next는 배열을 준다. 목록 필터는 전부 단일값이라 첫 값만 쓴다.
  const sp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) sp[k] = Array.isArray(v) ? v[0] : v;

  const sort = sp.sort ?? defaultSort;
  const order = sp.order === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const start = (page - 1) * PAGE_SIZE;

  /** 현재 쿼리를 보존하며 일부만 덮어쓴 링크. 빈 값과 1회성 배너 파라미터는 생략. */
  function href(overrides: Record<string, string | undefined> = {}): string {
    const params = new URLSearchParams();
    const merged = { ...sp, sort, order, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && k !== "saved" && k !== "error") params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  return {
    sp,
    sort,
    order,
    page,
    start,
    end: start + PAGE_SIZE,
    href,
    sortLink: (col: string) =>
      href({
        sort: col,
        order: sort === col && order === "asc" ? "desc" : "asc",
        page: "1",
      }),
    sortIndicator: (col: string) =>
      sort !== col ? null : order === "asc" ? " ↑" : " ↓",
  };
}
