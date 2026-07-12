import Link from "next/link";
import { apiFetch, apiList } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClickableRow } from "@/components/admin/clickable-row";
import { FacetFilter } from "@/components/admin/facet-filter";
import { ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

// 멀티 필터 설정 — 여기에 { param, label } 추가하면 필터·드롭다운이 자동으로 붙는다.
// (백엔드 _FILTERABLE 화이트리스트에도 동일 param을 추가해야 함)
const FACETS = [
  { param: "pipeline_status", label: "파이프라인 상태" },
  { param: "region_province", label: "도/광역시" },
  { param: "source", label: "소스" },
] as const;

type SpotListItem = {
  uid: string;
  title: string;
  pipeline_status: string | null;
  source: string | null;
  region_province: string | null;
  region_city: string | null;
  rating_avg: number;
  review_count: number;
  updated_at: string | null;
};

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function SpotsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const sort = sp.sort ?? "updated_at";
  const order = sp.order ?? "desc";
  const q = sp.q;
  const saved = sp.saved;
  const currentPage = Math.max(1, Number(sp.page ?? "1"));
  const start = (currentPage - 1) * PAGE_SIZE;

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
    _end: start + PAGE_SIZE,
    _sort: sort,
    _order: order,
    title_like: q || undefined,
    ...filterValues,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = !!(q || Object.values(filterValues).some(Boolean));

  // 현재 정렬/검색/필터를 보존하며 링크 쿼리스트링 생성
  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { sort, order, q: q ?? "", ...filterValues, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, String(v));
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  function sortLink(col: string) {
    const nextOrder = sort === col && order === "asc" ? "desc" : "asc";
    return buildQuery({ sort: col, order: nextOrder, page: "1" });
  }

  function sortIndicator(col: string) {
    if (sort !== col) return null;
    return order === "asc" ? " ↑" : " ↓";
  }

  return (
    <div className="flex flex-col gap-6">
      {saved && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          저장되었습니다.
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Spots <span className="text-zinc-400 text-base font-normal">{total}개</span></h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Link href={sortLink("title")}>이름{sortIndicator("title")}</Link></TableHead>
              <TableHead>상태</TableHead>
              <TableHead>소스</TableHead>
              <TableHead><Link href={sortLink("region_province")}>도/광역시{sortIndicator("region_province")}</Link></TableHead>
              <TableHead>시/군/구</TableHead>
              <TableHead><Link href={sortLink("rating_avg")}>평점{sortIndicator("rating_avg")}</Link></TableHead>
              <TableHead><Link href={sortLink("review_count")}>리뷰{sortIndicator("review_count")}</Link></TableHead>
              <TableHead><Link href={sortLink("updated_at")}>수정일{sortIndicator("updated_at")}</Link></TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {spots.map((spot) => (
              <ClickableRow key={spot.uid} href={`/spots/${spot.uid}/edit`}>
                <TableCell className="font-medium">{spot.title}</TableCell>
                <TableCell>
                  {spot.pipeline_status ? (
                    <Badge variant={spot.pipeline_status === "ENRICHED" ? "default" : "outline"}>
                      {spot.pipeline_status}
                    </Badge>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {spot.source ? <Badge variant="secondary">{spot.source}</Badge> : <span className="text-zinc-400">-</span>}
                </TableCell>
                <TableCell>{spot.region_province ?? "-"}</TableCell>
                <TableCell>{spot.region_city ?? "-"}</TableCell>
                <TableCell>{spot.rating_avg.toFixed(1)}</TableCell>
                <TableCell>{spot.review_count}</TableCell>
                <TableCell className="text-zinc-500 text-xs">
                  {spot.updated_at ? new Date(spot.updated_at).toLocaleDateString("ko-KR") : "-"}
                </TableCell>
                <TableCell className="w-8 text-right">
                  <Link href={`/spots/${spot.uid}/edit`} aria-label="편집" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <ChevronRight className="size-4 inline" />
                  </Link>
                </TableCell>
              </ClickableRow>
            ))}
            {spots.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-zinc-400 py-12">
                  데이터 없음
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {currentPage > 1 && (
            <Link href={buildQuery({ page: String(currentPage - 1) })} className="px-3 py-1 border rounded hover:bg-zinc-50 dark:hover:bg-zinc-900">
              이전
            </Link>
          )}
          <span className="text-zinc-500">{currentPage} / {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={buildQuery({ page: String(currentPage + 1) })} className="px-3 py-1 border rounded hover:bg-zinc-50 dark:hover:bg-zinc-900">
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
