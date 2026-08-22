import Link from "next/link";
import { apiList } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { StatusBanner } from "@/components/ui/status-banner";
import { ClickableRow } from "@/components/admin/clickable-row";
import { ChevronRight } from "lucide-react";

type BusinessInfoListItem = {
  uid: string;
  spot_uid: string;
  spot_title: string;
  business_type: string | null;
  operating_status: string | null;
  updated_at: string | null;
};

export default async function BusinessInfoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sp, sort, order, page, start, end, href, sortLink, sortIndicator } = listQuery(
    await searchParams
  );

  const { data: items, total } = await apiList<BusinessInfoListItem>(
    "/internal/spot-business-info",
    {
      _start: start,
      _end: end,
      _sort: sort,
      _order: order,
      spot_uid: sp.spot_uid || undefined,
    }
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner saved={sp.saved} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">
          Spot Business Info{" "}
          <span className="text-zinc-400 text-base font-normal">{total}개</span>
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/spot-business-info/new" className={buttonVariants({ variant: "default" })}>
            추가
          </Link>
          {sp.spot_uid && (
            <Link
              href="/spot-business-info"
              className="text-sm text-blue-600 hover:underline"
            >
              필터 해제 ✕
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead><Link href={sortLink("business_type")}>사업유형{sortIndicator("business_type")}</Link></TableHead>
              <TableHead><Link href={sortLink("operating_status")}>운영상태{sortIndicator("operating_status")}</Link></TableHead>
              <TableHead><Link href={sortLink("updated_at")}>수정일{sortIndicator("updated_at")}</Link></TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <ClickableRow key={item.uid} href={`/spot-business-info/${item.uid}/edit`}>
                <TableCell className="font-medium">{item.spot_title}</TableCell>
                <TableCell>{item.business_type ?? "-"}</TableCell>
                <TableCell>
                  {item.operating_status ? (
                    <Badge variant="secondary">{item.operating_status}</Badge>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-zinc-500 text-xs">
                  {fmtDate(item.updated_at)}
                </TableCell>
                <TableCell className="w-8 text-right">
                  {/* 행 클릭 외에 키보드/새 탭으로도 갈 수 있는 실제 링크 */}
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
            {items.length === 0 && <EmptyRow colSpan={5} />}
          </TableBody>
        </Table>
      </div>

      <Pager page={page} totalPages={totalPages} href={(p) => href({ page: String(p) })} />
    </div>
  );
}
