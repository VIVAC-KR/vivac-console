"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PIPELINE_STATUSES } from "@/lib/types";
import { useSpotsBulk } from "@/components/admin/spots-bulk-context";

/** 목록 제목("Spots N개") 옆에 붙는 인라인 선택 표시 + 일괄 상태변경 버튼.
 * 선택된 게 없으면 아무것도 렌더하지 않아 자리를 차지하지 않는다 —
 * 테이블/필터 등 나머지 레이아웃이 밀리지 않게 하기 위함. */
export function SpotsBulkIndicator() {
  const { selected, target, setTarget, bulk, handleBulkChange } = useSpotsBulk();
  const isBusy = bulk.phase === "queuing" || bulk.phase === "polling";

  if (selected.size === 0 && bulk.phase === "idle") return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {selected.size > 0 && (
        <>
          <span className="font-medium">{selected.size}개 선택됨</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={isBusy}
            className="h-7 rounded-md border bg-transparent px-2 text-xs"
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
        </>
      )}
      {bulk.phase === "done" && (
        <span role="status">
          <span className="text-emerald-600 dark:text-emerald-400">
            성공 {bulk.succeeded.length}건
          </span>
          {bulk.failed.length > 0 && (
            <>
              <span className="text-zinc-400"> · </span>
              <span
                className="text-destructive"
                title={bulk.failed.map((f) => `${f.uid}: ${f.reason}`).join("\n")}
              >
                실패 {bulk.failed.length}건
              </span>
            </>
          )}
        </span>
      )}
      {bulk.phase === "error" && (
        <span role="alert" className="text-destructive break-all">
          {bulk.message}
        </span>
      )}
    </div>
  );
}
