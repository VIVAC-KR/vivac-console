import Link from "next/link";
import { redirect } from "next/navigation";
import { apiCreateWithResult, apiFetch } from "@/lib/api";
import type { SpotDetail } from "@/lib/types";
import { SbiNewForm } from "@/components/admin/sbi-new-form";
import { StatusBanner } from "@/components/ui/status-banner";

async function createBusinessInfoAction(data: Record<string, unknown>) {
  "use server";
  const { data: created, error } = await apiCreateWithResult<{ uid: string }>(
    "/internal/spot-business-info",
    data
  );
  if (error || !created) {
    redirect(
      `/spot-business-info/new?error=${encodeURIComponent(error ?? "사업정보 생성 실패")}`
    );
  }
  redirect(`/spot-business-info/${created.uid}/edit?saved=1`);
}

export default async function BusinessInfoNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; spot_uid?: string }>;
}) {
  const { error, spot_uid } = await searchParams;

  // 스팟 편집 화면 등에서 spot_uid를 들고 넘어온 경우 미리 선택해둔다 (실패해도 검색으로 대체 가능)
  const initialSpot = spot_uid
    ? await apiFetch<SpotDetail>(`/internal/spots/${encodeURIComponent(spot_uid)}`)
        .then((s) => ({
          uid: s.uid,
          title: s.title,
          region_province: s.region_province,
          region_city: s.region_city,
        }))
        .catch(() => null)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/spot-business-info" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Business Info 목록
        </Link>
        <h1 className="mt-2 text-xl font-semibold">새 Business Info</h1>
      </div>

      <StatusBanner error={error} />

      <SbiNewForm initialSpot={initialSpot} onCreate={createBusinessInfoAction} />
    </div>
  );
}
