import Link from "next/link";
import { apiFetch, apiFetchOr404, apiMutate } from "@/lib/api";
import { fmtDateTime } from "@/lib/utils";
import type { BusinessInfoDetail } from "@/lib/types";
import { SbiEditForm } from "@/components/admin/sbi-edit-form";
import { ChangeHistory, type HistoryEntry } from "@/components/admin/change-history";

/** 저장 결과: 성공 시 null, 실패 시 에러 메시지 */
async function saveBusinessInfo(
  uid: string,
  data: Record<string, unknown>
): Promise<string | null> {
  "use server";
  return apiMutate(`/internal/spot-business-info/${encodeURIComponent(uid)}`, data);
}

export default async function BusinessInfoEditPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const encodedUid = encodeURIComponent(uid);

  const info = await apiFetchOr404<BusinessInfoDetail>(
    `/internal/spot-business-info/${encodedUid}`
  );

  // 수정 기록 — business_info 레코드 uid로 조회 (실패해도 편집 화면 유지)
  const history = await apiFetch<HistoryEntry[]>(
    `/internal/spot-business-info/${encodedUid}/history`
  ).catch(() => null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/spot-business-info" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Business Info 목록
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Business Info 편집</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Spot:{" "}
          <Link
            href={`/spots/${info.spot_uid}/edit`}
            className="font-mono text-blue-600 hover:underline"
          >
            {info.spot_uid}
          </Link>
          {info.updated_at && ` · 수정일: ${fmtDateTime(info.updated_at)}`}
        </p>
      </div>
      <SbiEditForm info={info} onSave={saveBusinessInfo} />

      <div className="max-w-2xl">
        <ChangeHistory entries={history} />
      </div>
    </div>
  );
}
