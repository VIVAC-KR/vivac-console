import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/auth";
import { SbiEditForm } from "@/components/admin/sbi-edit-form";
import { ChangeHistory, type HistoryEntry } from "@/components/admin/change-history";

type BusinessInfoDetail = {
  uid: string;
  spot_uid: string;
  business_reg_no: string | null;
  tourism_business_reg_no: string | null;
  business_type: string | null;
  operation_type: string | null;
  operating_agency: string | null;
  operating_status: string | null;
  national_park_no: number | null;
  national_park_office_code: string | null;
  national_park_serial_no: string | null;
  national_park_category_code: string | null;
  licensed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/** 저장 결과: 성공 시 null, 실패 시 에러 메시지 */
async function saveBusinessInfo(
  uid: string,
  data: Record<string, unknown>
): Promise<string | null> {
  "use server";
  const token = await getAccessToken();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/internal/spot-business-info/${uid}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? ""}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return `저장 실패 (${res.status}) ${body}`.trim();
  }
  return null;
}

export default async function BusinessInfoEditPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  let info: BusinessInfoDetail;
  try {
    info = await apiFetch<BusinessInfoDetail>(`/internal/spot-business-info/${uid}`);
  } catch {
    notFound();
  }

  // 수정 기록 — business_info 레코드 uid로 조회 (실패해도 편집 화면 유지)
  const history = await apiFetch<HistoryEntry[]>(
    `/internal/spot-business-info/${uid}/history`
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
          {info.updated_at && ` · 수정일: ${new Date(info.updated_at).toLocaleString("ko-KR")}`}
        </p>
      </div>
      <SbiEditForm info={info} onSave={saveBusinessInfo} />

      <div className="max-w-2xl">
        <ChangeHistory entries={history} />
      </div>
    </div>
  );
}
