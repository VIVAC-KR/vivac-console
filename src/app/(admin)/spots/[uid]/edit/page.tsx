import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
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

async function saveSpot(uid: string, data: Record<string, unknown>) {
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
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
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
      </div>
      <SpotEditForm spot={spot} onSave={saveSpot} />
    </div>
  );
}
