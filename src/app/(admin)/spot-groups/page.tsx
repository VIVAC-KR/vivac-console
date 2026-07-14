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
import { Button } from "@/components/ui/button";
import { ClickableRow } from "@/components/admin/clickable-row";
import { FacetFilter } from "@/components/admin/facet-filter";
import { ChevronRight } from "lucide-react";
import { SPOT_GROUP_VISIBILITIES, type SpotGroupAdminListItem } from "@/lib/types";

const PAGE_SIZE = 25;

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function SpotGroupsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const sort = sp.sort ?? "updated_at";
  const order = sp.order ?? "desc";
  const q = sp.q;
  const visibility = sp.visibility;
  const userUid = sp.user_uid;
  const saved = sp.saved;
  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const start = (currentPage - 1) * PAGE_SIZE;

  const { data: groups, total } = await apiList<SpotGroupAdminListItem>("/internal/groups", {
    _start: start,
    _end: start + PAGE_SIZE,
    _sort: sort,
    _order: order,
    name_like: q || undefined,
    visibility: visibility || undefined,
    user_uid: userUid || undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = !!(q || visibility || userUid);

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = {
      sort,
      order,
      q: q ?? "",
      visibility: visibility ?? "",
      user_uid: userUid ?? "",
      ...overrides,
    };
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
        <h1 className="text-xl font-semibold">
          Spot Groups <span className="text-zinc-400 text-base font-normal">{total}개</span>
        </h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
                  {group.updated_at ? new Date(group.updated_at).toLocaleDateString("ko-KR") : "-"}
                </TableCell>
                <TableCell className="w-8 text-right">
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
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-400 py-12">
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
