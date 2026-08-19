"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ClickableRow } from "@/components/admin/clickable-row";
import { fmtDate } from "@/lib/utils";
import { useSpotsBulk } from "@/components/admin/spots-bulk-context";

type SortLink = { href: string; indicator: string | null };

export function SpotsTable({
  isSuperuser,
  sortLinks,
}: {
  isSuperuser: boolean;
  sortLinks: Record<"title" | "region_province" | "rating_avg" | "review_count" | "updated_at", SortLink>;
}) {
  const { spots, selected, toggle, toggleAll } = useSpotsBulk();

  return (
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
  );
}
