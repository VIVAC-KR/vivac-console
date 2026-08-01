"use server";

import { apiFetch, ApiError } from "@/lib/api";

export type DbDumpJobStatus = "pending" | "running" | "succeeded" | "failed";

export type DbDumpJob = {
  uid: string;
  type: string;
  status: DbDumpJobStatus;
  result: { s3_key: string; size_bytes: number; format: string } | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "SUPERUSER 권한이 필요합니다.";
    if (err.status === 404) return "작업을 찾을 수 없습니다.";
    if (err.status === 409) return "덤프가 아직 준비되지 않았습니다.";
  }
  return err instanceof Error ? err.message : "요청 처리 중 오류가 발생했습니다.";
}

export async function queueDbDump(): Promise<ActionResult<{ job_id: string }>> {
  try {
    const data = await apiFetch<{ job_id: string }>("/internal/db-dumps", {
      method: "POST",
    });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: toErrorMessage(err) };
  }
}

export async function getDbDumpJob(jobId: string): Promise<ActionResult<DbDumpJob>> {
  try {
    const data = await apiFetch<DbDumpJob>(`/internal/jobs/${encodeURIComponent(jobId)}`);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: toErrorMessage(err) };
  }
}

export async function getDbDumpDownloadUrl(
  jobId: string
): Promise<ActionResult<{ download_url: string; expires_in: number }>> {
  try {
    const data = await apiFetch<{ download_url: string; expires_in: number }>(
      `/internal/db-dumps/${encodeURIComponent(jobId)}/download`
    );
    return { data, error: null };
  } catch (err) {
    return { data: null, error: toErrorMessage(err) };
  }
}
