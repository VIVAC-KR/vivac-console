import Link from "next/link";
import { apiFetch, apiList } from "@/lib/api";
import { listQuery, PAGE_SIZE } from "@/lib/list-query";
import { fmtDate } from "@/lib/utils";
import {
  EmptyRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pager } from "@/components/ui/pager";
import { StatusBanner } from "@/components/ui/status-banner";
import { ClickableRow } from "@/components/admin/clickable-row";
import { FacetFilter } from "@/components/admin/facet-filter";
import { ChevronRight } from "lucide-react";

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
  rating_avg: number | null;
  review_count: number;
  updated_at: string | null;
};

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
    <div className="flex flex-col gap-6">
      <StatusBanner saved={sp.saved} />
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
                <TableCell>{spot.rating_avg?.toFixed(1) ?? "-"}</TableCell>
                <TableCell>{spot.review_count}</TableCell>
                <TableCell className="text-zinc-500 text-xs">
                  {fmtDate(spot.updated_at)}
                </TableCell>
                <TableCell className="w-8 text-right">
                  {/* 행 클릭 외에 키보드/새 탭으로도 갈 수 있는 실제 링크 */}
                  <Link
                    href={`/spots/${spot.uid}/edit`}
                    aria-label="편집"
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <ChevronRight className="size-4 inline" />
                  </Link>
                </TableCell>
              </ClickableRow>
            ))}
            {spots.length === 0 && <EmptyRow colSpan={9} />}
          </TableBody>
        </Table>
      </div>

      <Pager page={page} totalPages={totalPages} href={(p) => href({ page: String(p) })} />
    </div>
  );
}
