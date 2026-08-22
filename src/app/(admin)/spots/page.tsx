import Link from "next/link";
import { apiFetch, apiList } from "@/lib/api";
import { listQuery, PAGE_SIZE } from "@/lib/list-query";
import { auth } from "@/auth";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { StatusBanner } from "@/components/ui/status-banner";
import { FacetFilter } from "@/components/admin/facet-filter";
import { SpotsTable } from "@/components/admin/spots-table";
import { SpotsBulkProvider } from "@/components/admin/spots-bulk-context";
import { SpotsBulkIndicator } from "@/components/admin/spots-bulk-indicator";
import type { SpotListItem } from "@/lib/types";

// 멀티 필터 설정 — 여기에 { param, label } 추가하면 필터·드롭다운이 자동으로 붙는다.
// (백엔드 _FILTERABLE 화이트리스트에도 동일 param을 추가해야 함)
const FACETS = [
  { param: "pipeline_status", label: "파이프라인 상태" },
  { param: "region_province", label: "도/광역시" },
  { param: "source", label: "소스" },
] as const;

export default async function SpotsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sp, sort, order, page, start, end, href, sortLink, sortIndicator } = listQuery(
    await searchParams
  );
  const q = sp.q;
  const assignedToUid = sp.assigned_to_uid;
  const session = await auth();
  const isSuperuser = session?.user?.staffRole === "superuser";

  // 각 패싯의 옵션(distinct) 병렬 로드 (실패해도 빈 목록으로 degrade)
  const facetOptions = await Promise.all(
    FACETS.map((f) =>
      apiFetch<string[]>(`/internal/spots/distinct/${f.param}`).catch(() => [])
    )
  );

  // 활성 필터값
  const filterValues: Record<string, string | undefined> = {};
  for (const f of FACETS) filterValues[f.param] = sp[f.param];

  const { data: spots, total } = await apiList<SpotListItem>("/internal/spots", {
    _start: start,
    _end: end,
    _sort: sort,
    _order: order,
    title_like: q || undefined,
    assigned_to_uid: assignedToUid,
    ...filterValues,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = !!(q || assignedToUid || Object.values(filterValues).some(Boolean));

  return (
    <SpotsBulkProvider spots={spots}>
      <div className="flex flex-col gap-6">
        <StatusBanner saved={sp.saved} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold">Spots <span className="text-zinc-400 text-base font-normal">{total}개</span></h1>
            {isSuperuser && <SpotsBulkIndicator />}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/spots/new" className={buttonVariants({ variant: "default" })}>
              추가
            </Link>
            {FACETS.map((f, i) => (
              <FacetFilter
                key={f.param}
                label={f.label}
                param={f.param}
                options={facetOptions[i]}
                value={filterValues[f.param]}
              />
            ))}
            <form className="w-full sm:w-auto">
              <input type="hidden" name="sort" value={sort} />
              <input type="hidden" name="order" value={order} />
              {/* My Queue에서 검색해도 담당자 필터가 유지되도록 함께 넘긴다 */}
              {assignedToUid && (
                <input type="hidden" name="assigned_to_uid" value={assignedToUid} />
              )}
              {FACETS.map((f) => (
                <input key={f.param} type="hidden" name={f.param} value={filterValues[f.param] ?? ""} />
              ))}
              <Input name="q" defaultValue={q} placeholder="이름 검색…" className="w-full sm:w-64" />
            </form>
            {hasActiveFilters && (
              <Link
                href="/spots"
                className="shrink-0 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                초기화 ✕
              </Link>
            )}
          </div>
        </div>

        <SpotsTable
          isSuperuser={isSuperuser}
          sortLinks={{
            title: { href: sortLink("title"), indicator: sortIndicator("title") },
            region_province: { href: sortLink("region_province"), indicator: sortIndicator("region_province") },
            rating_avg: { href: sortLink("rating_avg"), indicator: sortIndicator("rating_avg") },
            review_count: { href: sortLink("review_count"), indicator: sortIndicator("review_count") },
            updated_at: { href: sortLink("updated_at"), indicator: sortIndicator("updated_at") },
          }}
        />

        <Pager page={page} totalPages={totalPages} href={(p) => href({ page: String(p) })} />
      </div>
    </SpotsBulkProvider>
  );
}
