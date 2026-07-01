import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch, apiList } from "@/lib/api";
import { auth } from "@/auth";
import { SpotEditForm } from "@/components/admin/spot-edit-form";

type SpotDetail = {
  uid: string;
  title: string;
  source: string | null;
  external_id: string | null;
  address: string | null;
  address_detail: string | null;
  region_province: string | null;
  region_city: string | null;
  postal_code: string | null;
  phone: string | null;
  description: string | null;
  tagline: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  unit_count: number | null;
  is_fee_required: boolean | null;
  is_pet_allowed: boolean | null;
  pet_policy: string | null;
  has_equipment_rental: string[] | null;
  themes: string[] | null;
  fire_pit_type: string | null;
  amenities: string[] | null;
  nearby_facilities: string[] | null;
  camp_sight_type: string | null;
  rating_avg: number;
  review_count: number;
  website_url: string | null;
  booking_url: string | null;
  features: string | null;
  category: string[] | null;
  total_area_m2: number | null;
  has_liability_insurance: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

/** 저장 결과: 성공 시 null, 실패 시 에러 메시지 */
async function saveSpot(
  uid: string,
  data: Record<string, unknown>
): Promise<string | null> {
  "use server";
  const session = await auth();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/internal/spots/${uid}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken ?? ""}`,
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

export default async function SpotEditPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  let spot: SpotDetail;
  try {
    spot = await apiFetch<SpotDetail>(`/internal/spots/${uid}`);
  } catch {
    notFound();
  }

  // 이 스팟의 사업정보 (보통 1건). 1건이면 상세로 직행, 여러 건이면 필터 목록으로.
  const { data: biList, total: biTotal } = await apiList<{ uid: string }>(
    "/internal/spot-business-info",
    { spot_uid: uid, _start: 0, _end: 1 }
  );
  const businessInfoHref =
    biTotal === 1
      ? `/spot-business-info/${biList[0].uid}/edit`
      : `/spot-business-info?spot_uid=${uid}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/spots" className="text-sm text-zinc-500 hover:text-zinc-900">← Spots 목록</Link>
        <h1 className="mt-2 text-xl font-semibold">{spot.title}</h1>
        <p className="text-xs text-zinc-400 mt-1">
          {spot.source && `소스: ${spot.source}`}
          {spot.external_id && ` · ID: ${spot.external_id}`}
          {spot.updated_at && ` · 수정일: ${new Date(spot.updated_at).toLocaleString("ko-KR")}`}
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          {biTotal > 0 ? (
            <Link href={businessInfoHref} className="text-blue-600 hover:underline">
              이 스팟의 사업정보 {biTotal > 1 ? `${biTotal}건 보기` : "보기"} →
            </Link>
          ) : (
            <span className="text-zinc-400">사업정보 없음</span>
          )}
          {spot.latitude != null && spot.longitude != null && (
            <a
              href={`https://map.kakao.com/link/map/${encodeURIComponent(spot.title)},${spot.latitude},${spot.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              카카오맵에서 열기 ↗
            </a>
          )}
        </div>
      </div>

      {spot.latitude != null && spot.longitude != null && (
        <iframe
          title="위치 미리보기"
          className="w-full max-w-2xl h-64 rounded-lg border"
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${spot.longitude - 0.01},${spot.latitude - 0.01},${spot.longitude + 0.01},${spot.latitude + 0.01}&layer=mapnik&marker=${spot.latitude},${spot.longitude}`}
        />
      )}

      <SpotEditForm spot={spot} onSave={saveSpot} />
    </div>
  );
}
