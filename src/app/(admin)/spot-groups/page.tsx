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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { StatusBanner } from "@/components/ui/status-banner";
import { ClickableRow } from "@/components/admin/clickable-row";
import { FacetFilter } from "@/components/admin/facet-filter";
import { ChevronRight } from "lucide-react";
import { SPOT_GROUP_VISIBILITIES, type SpotGroupAdminListItem } from "@/lib/types";

export default async function SpotGroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sp, sort, order, page, start, end, href, sortLink, sortIndicator } = listQuery(
    await searchParams
  );
  const q = sp.q;
  const visibility = sp.visibility;
  const userUid = sp.user_uid;

  const { data: groups, total } = await apiList<SpotGroupAdminListItem>("/internal/groups", {
    _start: start,
    _end: end,
    _sort: sort,
    _order: order,
    name_like: q || undefined,
    visibility: visibility || undefined,
    user_uid: userUid || undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = !!(q || visibility || userUid);

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner saved={sp.saved} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">
          Spot Groups <span className="text-zinc-400 text-base font-normal">{total}개</span>
        </h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Link href="/spot-groups/new" className={buttonVariants({ variant: "default" })}>
            새 그룹
          </Link>
          <FacetFilter
            label="공개범위"
            param="visibility"
            options={SPOT_GROUP_VISIBILITIES}
            value={visibility}
          />
          <form className="flex w-full gap-2 sm:w-auto">
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />
            <input type="hidden" name="visibility" value={visibility ?? ""} />
            <Input name="q" defaultValue={q} placeholder="그룹명 검색…" className="w-full sm:w-48" />
            <Input
              name="user_uid"
              defaultValue={userUid}
              placeholder="유저 UID…"
              className="w-full sm:w-48"
            />
            <Button type="submit" variant="outline">검색</Button>
          </form>
          {hasActiveFilters && (
            <Link
              href="/spot-groups"
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
              <TableHead><Link href={sortLink("name")}>이름{sortIndicator("name")}</Link></TableHead>
              <TableHead><Link href={sortLink("visibility")}>공개범위{sortIndicator("visibility")}</Link></TableHead>
              <TableHead>멤버</TableHead>
              <TableHead>스팟</TableHead>
              <TableHead><Link href={sortLink("updated_at")}>수정일{sortIndicator("updated_at")}</Link></TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <ClickableRow key={group.uid} href={`/spot-groups/${group.uid}/edit`}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>
                  <Badge variant={group.visibility === "public" ? "default" : "secondary"}>
                    {group.visibility}
                  </Badge>
                </TableCell>
                <TableCell>{group.member_count}</TableCell>
                <TableCell>{group.spot_count}</TableCell>
                <TableCell className="text-zinc-500 text-xs">
                  {fmtDate(group.updated_at)}
                </TableCell>
                <TableCell className="w-8 text-right">
                  {/* 행 클릭 외에 키보드/새 탭으로도 갈 수 있는 실제 링크 */}
                  <Link
                    href={`/spot-groups/${group.uid}/edit`}
                    aria-label="편집"
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <ChevronRight className="size-4 inline" />
                  </Link>
                </TableCell>
              </ClickableRow>
            ))}
            {groups.length === 0 && <EmptyRow colSpan={6} />}
          </TableBody>
        </Table>
      </div>

      <Pager page={page} totalPages={totalPages} href={(p) => href({ page: String(p) })} />
    </div>
  );
}
