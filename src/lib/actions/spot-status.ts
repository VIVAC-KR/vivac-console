"use server";

import { apiFetch, apiMutateWithResult, ApiError } from "@/lib/api";

export type SpotBulkStatusJob = {
  uid: string;
  type: string;
  status: "pending" | "running" | "succeeded" | "failed";
  result: { succeeded: string[]; failed: { uid: string; reason: string }[] } | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 필요합니다.";
    if (err.status === 403) return "SUPERUSER 권한이 필요합니다.";
    if (err.status === 404) return "작업을 찾을 수 없습니다.";
  }
  return err instanceof Error ? err.message : "요청 처리 중 오류가 발생했습니다.";
}

export async function queueBulkStatus(uids: string[], pipeline_status: string) {
  return apiMutateWithResult<{ job_id: string }>("/internal/spots/bulk-status", {
    uids,
    pipeline_status,
  });
}

export async function getBulkStatusJob(jobId: string): Promise<ActionResult<SpotBulkStatusJob>> {
  try {
    return { data: await apiFetch<SpotBulkStatusJob>(`/internal/jobs/${encodeURIComponent(jobId)}`), error: null };
  } catch (err) {
    return { data: null, error: toErrorMessage(err) };
  }
}
