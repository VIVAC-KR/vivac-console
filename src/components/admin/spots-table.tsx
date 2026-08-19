"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import {
  EmptyRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClickableRow } from "@/components/admin/clickable-row";
import { fmtDate } from "@/lib/utils";
import { PIPELINE_STATUSES } from "@/lib/types";
import { queueBulkStatus, getBulkStatusJob } from "@/lib/actions/spot-status";

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_MS = 5 * 60 * 1000;

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

type BulkState =
  | { phase: "idle" }
  | { phase: "queuing" }
  | { phase: "polling"; jobId: string; startedAt: number }
  | { phase: "done"; succeeded: string[]; failed: { uid: string; reason: string }[] }
  | { phase: "error"; message: string };

type SortLink = { href: string; indicator: string | null };

export function SpotsTable({
  spots,
  isSuperuser,
  sortLinks,
}: {
  spots: SpotListItem[];
  isSuperuser: boolean;
  sortLinks: Record<"title" | "region_province" | "rating_avg" | "review_count" | "updated_at", SortLink>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<string>(PIPELINE_STATUSES[0]);
  const [bulk, setBulk] = useState<BulkState>({ phase: "idle" });

  useEffect(() => {
    if (bulk.phase !== "polling") return;
    const { jobId, startedAt } = bulk;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const deadline = setTimeout(() => {
      cancelled = true;
      setBulk({ phase: "error", message: "상태 변경이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요." });
    }, Math.max(0, TIMEOUT_MS - (Date.now() - startedAt)));

    async function poll() {
      const { data: job, error } = await getBulkStatusJob(jobId);
      if (cancelled) return;

      if (error || !job) {
        setBulk({ phase: "error", message: error ?? "작업 상태 조회 실패" });
        return;
      }

      if (job.status === "failed") {
        setBulk({ phase: "error", message: (job.error ?? "상태 변경 실패").split("\n")[0] });
        return;
      }

      if (job.status === "succeeded") {
        const succeeded = job.result?.succeeded ?? [];
        const failed = job.result?.failed ?? [];
        setSelected((prev) => {
          const next = new Set(prev);
          for (const uid of succeeded) next.delete(uid);
          return next;
        });
        setBulk({ phase: "done", succeeded, failed });
        router.refresh();
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    timer = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(deadline);
    };
  }, [bulk, router]);

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === spots.length ? new Set() : new Set(spots.map((s) => s.uid))
    );
  }

  async function handleBulkChange() {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개 spot의 상태를 "${target}"(으)로 변경하시겠습니까?`)) return;
    setBulk({ phase: "queuing" });
    const { data, error } = await queueBulkStatus(Array.from(selected), target);
    if (error || !data) {
      setBulk({ phase: "error", message: error ?? "요청 실패" });
      return;
    }
    setBulk({ phase: "polling", jobId: data.job_id, startedAt: Date.now() });
  }

  const isBusy = bulk.phase === "queuing" || bulk.phase === "polling";
  const titleOf = (uid: string) => spots.find((s) => s.uid === uid)?.title ?? uid;

  return (
    <div className="flex flex-col gap-3">
      {isSuperuser && selected.size > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{selected.size}개 선택됨</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isBusy}
              className="h-8 rounded-md border bg-transparent px-2 text-sm"
            >
              {PIPELINE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" disabled={isBusy} onClick={handleBulkChange}>
              {isBusy && <Loader2 className="animate-spin" />}
              {bulk.phase === "queuing" && "요청 중…"}
              {bulk.phase === "polling" && "변경 중…"}
              {!isBusy && "상태 일괄 변경"}
            </Button>
          </div>
          {bulk.phase === "done" && (
            <div role="status" className="text-sm">
              <span className="text-emerald-600 dark:text-emerald-400">
                성공 {bulk.succeeded.length}건
              </span>
              {bulk.failed.length > 0 && (
                <>
                  <span className="text-zinc-400"> · </span>
                  <span className="text-destructive">실패 {bulk.failed.length}건</span>
                  <ul className="mt-1 flex flex-col gap-0.5 text-xs text-zinc-500">
                    {bulk.failed.map((f) => (
                      <li key={f.uid}>
                        {titleOf(f.uid)}: {f.reason}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          {bulk.phase === "error" && (
            <p role="alert" className="text-sm text-destructive break-all">
              {bulk.message}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {isSuperuser && (
                <TableHead>
                  <Checkbox
                    aria-label="전체 선택"
                    checked={selected.size > 0 && selected.size === spots.length}
                    indeterminate={selected.size > 0 && selected.size < spots.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
              <TableHead><Link href={sortLinks.title.href}>이름{sortLinks.title.indicator}</Link></TableHead>
              <TableHead>상태</TableHead>
              <TableHead>소스</TableHead>
              <TableHead><Link href={sortLinks.region_province.href}>도/광역시{sortLinks.region_province.indicator}</Link></TableHead>
              <TableHead>시/군/구</TableHead>
              <TableHead><Link href={sortLinks.rating_avg.href}>평점{sortLinks.rating_avg.indicator}</Link></TableHead>
              <TableHead><Link href={sortLinks.review_count.href}>리뷰{sortLinks.review_count.indicator}</Link></TableHead>
              <TableHead><Link href={sortLinks.updated_at.href}>수정일{sortLinks.updated_at.indicator}</Link></TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {spots.map((spot) => (
              <ClickableRow key={spot.uid} href={`/spots/${spot.uid}/edit`}>
                {isSuperuser && (
                  <TableCell>
                    <Checkbox
                      aria-label={`${spot.title} 선택`}
                      checked={selected.has(spot.uid)}
                      onCheckedChange={() => toggle(spot.uid)}
                    />
                  </TableCell>
                )}
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
            {spots.length === 0 && <EmptyRow colSpan={isSuperuser ? 10 : 9} />}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
