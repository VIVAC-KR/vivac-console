"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { queueDbDump, getDbDumpJob, getDbDumpDownloadUrl } from "@/lib/actions/db-dump";

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_MS = 5 * 60 * 1000;

type State =
  | { phase: "idle" }
  | { phase: "queuing" }
  | { phase: "polling"; jobId: string; startedAt: number }
  | { phase: "downloading" }
  | { phase: "done"; sizeBytes: number }
  | { phase: "error"; message: string };

/** 백엔드가 준 다운로드 URL 검증 — http(s)가 아니면 이동하지 않는다 */
function isHttpUrl(url: string) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function DbDumpButton() {
  const [state, setState] = useState<State>({ phase: "idle" });

  useEffect(() => {
    if (state.phase !== "polling") return;
    const { jobId, startedAt } = state;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // 전체 시한은 폴링과 별도 타이머로 잰다 — 조회 요청 하나가 영영 안 끝나도 풀린다
    const deadline = setTimeout(() => {
      cancelled = true;
      setState({ phase: "error", message: "덤프 생성이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요." });
    }, Math.max(0, TIMEOUT_MS - (Date.now() - startedAt)));

    // 응답을 받은 뒤에 다음 tick을 예약한다 — 조회가 느려도 폴링이 겹치지 않는다
    async function poll() {
      const { data: job, error } = await getDbDumpJob(jobId);
      if (cancelled) return;

      if (error || !job) {
        setState({ phase: "error", message: error ?? "작업 상태 조회 실패" });
        return;
      }

      if (job.status === "failed") {
        setState({ phase: "error", message: (job.error ?? "덤프 생성 실패").split("\n")[0] });
        return;
      }

      if (job.status === "succeeded") {
        // 여기부터는 취소하지 않는다 — downloading 전환이 이 effect를 정리시키기 때문
        setState({ phase: "downloading" });
        const { data: download, error: downloadError } = await getDbDumpDownloadUrl(jobId);
        if (downloadError || !download) {
          setState({ phase: "error", message: downloadError ?? "다운로드 URL 발급 실패" });
          return;
        }
        if (!isHttpUrl(download.download_url)) {
          setState({ phase: "error", message: "다운로드 URL이 올바르지 않습니다." });
          return;
        }
        window.location.href = download.download_url;
        setState({ phase: "done", sizeBytes: job.result?.size_bytes ?? 0 });
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
  }, [state]);

  async function handleClick() {
    setState({ phase: "queuing" });
    const { data, error } = await queueDbDump();
    if (error || !data) {
      setState({ phase: "error", message: error ?? "덤프 요청 실패" });
      return;
    }
    setState({ phase: "polling", jobId: data.job_id, startedAt: Date.now() });
  }

  const isBusy =
    state.phase === "queuing" || state.phase === "polling" || state.phase === "downloading";

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" disabled={isBusy} onClick={handleClick}>
        {isBusy && <Loader2 className="animate-spin" />}
        {state.phase === "queuing" && "덤프 요청 중…"}
        {state.phase === "polling" && "덤프 생성 중…"}
        {state.phase === "downloading" && "다운로드 준비 중…"}
        {!isBusy && "DB 덤프 다운로드"}
      </Button>

      {state.phase === "done" && (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          다운로드 완료 ({formatBytes(state.sizeBytes)})
        </p>
      )}
      {state.phase === "error" && (
        <p role="alert" className="text-sm text-destructive break-all">
          {state.message}
        </p>
      )}
      <p className="text-xs text-zinc-400">
        pg_restore --no-owner --no-privileges --clean --if-exists -h &lt;host&gt; -U &lt;user&gt; -d &lt;db&gt; vivac-db-dump-&lt;job_id&gt;.dump
      </p>
    </div>
  );
}
