import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch, apiList, apiMutate, ApiError } from "@/lib/api";
import { auth } from "@/auth";
import type { SpotDetail, SpotOption } from "@/lib/types";
import { SpotEditForm } from "@/components/admin/spot-edit-form";
import { ChangeHistory, type HistoryEntry } from "@/components/admin/change-history";
import { CopyButton } from "@/components/admin/copy-button";

/** 저장 결과: 성공 시 null, 실패 시 에러 메시지 */
async function saveSpot(
  uid: string,
  data: Record<string, unknown>
): Promise<string | null> {
  "use server";
  return apiMutate(`/internal/spots/${encodeURIComponent(uid)}`, data);
}

export default async function SpotEditPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const encodedUid = encodeURIComponent(uid);
  const session = await auth();

  let spot: SpotDetail;
  try {
    spot = await apiFetch<SpotDetail>(`/internal/spots/${encodedUid}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // 이 스팟의 사업정보 (보통 1건). 1건이면 상세로 직행, 여러 건이면 필터 목록으로.
  // 수정 기록 — 실패해도 편집 화면은 유지 (편집이 우선)
  const [
    { data: biList, total: biTotal },
    history,
    category,
    amenities,
    nearby_facilities,
    has_equipment_rental,
  ] = await Promise.all([
    apiList<{ uid: string }>("/internal/spot-business-info", {
      spot_uid: uid,
      _start: 0,
      _end: 1,
    }),
    apiFetch<HistoryEntry[]>(`/internal/spots/${encodedUid}/history`).catch(
      () => null
    ),
    apiFetch<SpotOption[]>("/internal/spot-options?field=category"),
    apiFetch<SpotOption[]>("/internal/spot-options?field=amenities"),
    apiFetch<SpotOption[]>("/internal/spot-options?field=nearby_facilities"),
    apiFetch<SpotOption[]>("/internal/spot-options?field=has_equipment_rental"),
  ]);
  const fieldOptions = { category, amenities, nearby_facilities, has_equipment_rental };
  const businessInfoHref =
    biTotal === 1 && biList[0]
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
        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>UID: {spot.uid}</span>
          <CopyButton value={spot.uid} />
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          {biTotal > 0 ? (
            <Link href={businessInfoHref} className="text-blue-600 hover:underline">
              이 장소의 사업정보 {biTotal > 1 ? `${biTotal}건 보기` : "보기"} →
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

      <SpotEditForm
        spot={spot}
        currentUserId={session?.user?.id}
        fieldOptions={fieldOptions}
        onSave={saveSpot}
      />

      <div className="max-w-2xl">
        <ChangeHistory entries={history} />
      </div>
    </div>
  );
}
