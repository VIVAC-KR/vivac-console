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
import { Badge } from "@/components/ui/badge";
import { ClickableRow } from "@/components/admin/clickable-row";
import { ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

type BusinessInfoListItem = {
  uid: string;
  spot_uid: string;
  spot_title: string;
  business_type: string | null;
  operating_status: string | null;
  updated_at: string | null;
};

type SearchParams = Promise<{
  page?: string;
  sort?: string;
  order?: string;
  spot_uid?: string;
  saved?: string;
}>;

export default async function BusinessInfoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page = "1", sort = "updated_at", order = "desc", spot_uid, saved } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const start = (currentPage - 1) * PAGE_SIZE;

  const { data: items, total } = await apiList<BusinessInfoListItem>(
    "/internal/spot-business-info",
    {
      _start: start,
      _end: start + PAGE_SIZE,
      _sort: sort,
      _order: order,
      spot_uid: spot_uid || undefined,
    }
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function sortLink(col: string) {
    const nextOrder = sort === col && order === "asc" ? "desc" : "asc";
    return `?sort=${col}&order=${nextOrder}&page=1${spot_uid ? `&spot_uid=${spot_uid}` : ""}`;
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
        <h1 className="text-xl font-semibold">
          Spot Business Info{" "}
          <span className="text-zinc-400 text-base font-normal">{total}개</span>
        </h1>
        {spot_uid && (
          <Link
            href="/spot-business-info"
            className="text-sm text-blue-600 hover:underline"
          >
            필터 해제 ✕
          </Link>
        )}
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>스팟</TableHead>
              <TableHead><Link href={sortLink("business_type")}>사업유형{sortIndicator("business_type")}</Link></TableHead>
              <TableHead><Link href={sortLink("operating_status")}>운영상태{sortIndicator("operating_status")}</Link></TableHead>
              <TableHead><Link href={sortLink("updated_at")}>수정일{sortIndicator("updated_at")}</Link></TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <ClickableRow key={item.uid} href={`/spot-business-info/${item.uid}/edit`}>
                <TableCell>
                  <Link
                    href={`/spots/${item.spot_uid}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    {item.spot_title}
                  </Link>
                </TableCell>
                <TableCell>{item.business_type ?? "-"}</TableCell>
                <TableCell>
                  {item.operating_status ? (
                    <Badge variant="secondary">{item.operating_status}</Badge>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-zinc-500 text-xs">
                  {item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString("ko-KR")
                    : "-"}
                </TableCell>
                <TableCell className="w-8 text-right">
                  <Link
                    href={`/spot-business-info/${item.uid}/edit`}
                    aria-label="편집"
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <ChevronRight className="size-4 inline" />
                  </Link>
                </TableCell>
              </ClickableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-400 py-12">
                  데이터 없음
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {currentPage > 1 && (
            <Link
              href={`?sort=${sort}&order=${order}&page=${currentPage - 1}${spot_uid ? `&spot_uid=${spot_uid}` : ""}`}
              className="px-3 py-1 border rounded hover:bg-zinc-50"
            >
              이전
            </Link>
          )}
          <span className="text-zinc-500">{currentPage} / {totalPages}</span>
          {currentPage < totalPages && (
            <Link
              href={`?sort=${sort}&order=${order}&page=${currentPage + 1}${spot_uid ? `&spot_uid=${spot_uid}` : ""}`}
              className="px-3 py-1 border rounded hover:bg-zinc-50"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
