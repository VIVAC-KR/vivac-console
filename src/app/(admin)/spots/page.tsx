import Link from "next/link";
import { apiList } from "@/lib/api";
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
import { ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

type SpotListItem = {
  uid: string;
  title: string;
  source: string | null;
  region_province: string | null;
  region_city: string | null;
  rating_avg: number;
  review_count: number;
  updated_at: string | null;
};

type SearchParams = Promise<{
  page?: string;
  sort?: string;
  order?: string;
  q?: string;
  saved?: string;
}>;

export default async function SpotsPage({ searchParams }: { searchParams: SearchParams }) {
  const { page = "1", sort = "updated_at", order = "desc", q, saved } = await searchParams;
  const currentPage = Math.max(1, Number(page));
  const start = (currentPage - 1) * PAGE_SIZE;

  const { data: spots, total } = await apiList<SpotListItem>("/internal/spots", {
    _start: start,
    _end: start + PAGE_SIZE,
    _sort: sort,
    _order: order,
    title_like: q || undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function sortLink(col: string) {
    const nextOrder = sort === col && order === "asc" ? "desc" : "asc";
    return `?sort=${col}&order=${nextOrder}&q=${q ?? ""}&page=1`;
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Spots <span className="text-zinc-400 text-base font-normal">{total}개</span></h1>
        <form>
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="order" value={order} />
          <Input name="q" defaultValue={q} placeholder="이름 검색…" className="w-64" />
        </form>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Link href={sortLink("title")}>이름{sortIndicator("title")}</Link></TableHead>
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
                <TableCell colSpan={8} className="text-center text-zinc-400 py-12">
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
            <Link href={`?sort=${sort}&order=${order}&q=${q ?? ""}&page=${currentPage - 1}`} className="px-3 py-1 border rounded hover:bg-zinc-50">
              이전
            </Link>
          )}
          <span className="text-zinc-500">{currentPage} / {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={`?sort=${sort}&order=${order}&q=${q ?? ""}&page=${currentPage + 1}`} className="px-3 py-1 border rounded hover:bg-zinc-50">
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
