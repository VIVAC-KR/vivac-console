"use client";

import { useEffect, useRef, useState } from "react";
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

export function DbDumpButton() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (state.phase !== "polling") return;
    const { jobId, startedAt } = state;

    intervalRef.current = setInterval(async () => {
      if (Date.now() - startedAt > TIMEOUT_MS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState({ phase: "error", message: "덤프 생성이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요." });
        return;
      }

      const { data: job, error } = await getDbDumpJob(jobId);
      if (error || !job) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState({ phase: "error", message: error ?? "작업 상태 조회 실패" });
        return;
      }

      if (job.status === "failed") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState({ phase: "error", message: (job.error ?? "덤프 생성 실패").split("\n")[0] });
        return;
      }

      if (job.status === "succeeded") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState({ phase: "downloading" });
        const { data: download, error: downloadError } = await getDbDumpDownloadUrl(jobId);
        if (downloadError || !download) {
          setState({ phase: "error", message: downloadError ?? "다운로드 URL 발급 실패" });
          return;
        }
        window.location.href = download.download_url;
        setState({ phase: "done", sizeBytes: job.result?.size_bytes ?? 0 });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
        {(state.phase === "idle" || state.phase === "done" || state.phase === "error") &&
          "DB 덤프 다운로드"}
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
