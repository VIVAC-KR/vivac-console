"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// 배열 필드는 쉼표 구분 문자열로 표시
type SpotDetail = {
  uid: string;
  title: string;
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
  website_url: string | null;
  booking_url: string | null;
  features: string | null;
  category: string[] | null;
  total_area_m2: number | null;
  has_liability_insurance: boolean | null;
};

type FormValues = {
  title: string;
  address: string;
  address_detail: string;
  region_province: string;
  region_city: string;
  postal_code: string;
  phone: string;
  description: string;
  tagline: string;
  latitude: string;
  longitude: string;
  altitude: string;
  unit_count: string;
  is_fee_required: string;
  is_pet_allowed: string;
  pet_policy: string;
  themes: string;
  fire_pit_type: string;
  amenities: string;
  nearby_facilities: string;
  camp_sight_type: string;
  has_equipment_rental: string;
  website_url: string;
  booking_url: string;
  features: string;
  category: string;
  total_area_m2: string;
  has_liability_insurance: string;
};

function arr(v: string[] | null) {
  return v?.join(", ") ?? "";
}

function parseArr(v: string): string[] | null {
  const items = v.split(",").map((s) => s.trim()).filter(Boolean);
  return items.length ? items : null;
}

function parseBool(v: string): boolean | null {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function parseNum(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export function SpotEditForm({
  spot,
  onSave,
}: {
  spot: SpotDetail;
  onSave: (uid: string, data: Record<string, unknown>) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      title: spot.title,
      address: spot.address ?? "",
      address_detail: spot.address_detail ?? "",
      region_province: spot.region_province ?? "",
      region_city: spot.region_city ?? "",
      postal_code: spot.postal_code ?? "",
      phone: spot.phone ?? "",
      description: spot.description ?? "",
      tagline: spot.tagline ?? "",
      latitude: spot.latitude?.toString() ?? "",
      longitude: spot.longitude?.toString() ?? "",
      altitude: spot.altitude?.toString() ?? "",
      unit_count: spot.unit_count?.toString() ?? "",
      is_fee_required: spot.is_fee_required?.toString() ?? "",
      is_pet_allowed: spot.is_pet_allowed?.toString() ?? "",
      pet_policy: spot.pet_policy ?? "",
      themes: arr(spot.themes),
      fire_pit_type: spot.fire_pit_type ?? "",
      amenities: arr(spot.amenities),
      nearby_facilities: arr(spot.nearby_facilities),
      camp_sight_type: spot.camp_sight_type ?? "",
      has_equipment_rental: arr(spot.has_equipment_rental),
      website_url: spot.website_url ?? "",
      booking_url: spot.booking_url ?? "",
      features: spot.features ?? "",
      category: arr(spot.category),
      total_area_m2: spot.total_area_m2?.toString() ?? "",
      has_liability_insurance: spot.has_liability_insurance?.toString() ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await onSave(spot.uid, {
        title: values.title || undefined,
        address: values.address || null,
        address_detail: values.address_detail || null,
        region_province: values.region_province || null,
        region_city: values.region_city || null,
        postal_code: values.postal_code || null,
        phone: values.phone || null,
        description: values.description || null,
        tagline: values.tagline || null,
        latitude: parseNum(values.latitude),
        longitude: parseNum(values.longitude),
        altitude: parseNum(values.altitude),
        unit_count: values.unit_count ? parseInt(values.unit_count) : null,
        is_fee_required: parseBool(values.is_fee_required),
        is_pet_allowed: parseBool(values.is_pet_allowed),
        pet_policy: values.pet_policy || null,
        themes: parseArr(values.themes),
        fire_pit_type: values.fire_pit_type || null,
        amenities: parseArr(values.amenities),
        nearby_facilities: parseArr(values.nearby_facilities),
        camp_sight_type: values.camp_sight_type || null,
        has_equipment_rental: parseArr(values.has_equipment_rental),
        website_url: values.website_url || null,
        booking_url: values.booking_url || null,
        features: values.features || null,
        category: parseArr(values.category),
        total_area_m2: parseNum(values.total_area_m2),
        has_liability_insurance: parseBool(values.has_liability_insurance),
      });
      router.push("/spots");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">기본 정보</h2>
        <Field label="이름 *"><Input {...register("title")} required /></Field>
        <Field label="tagline"><Input {...register("tagline")} /></Field>
        <Field label="설명"><Textarea {...register("description")} rows={4} /></Field>
        <Field label="카테고리 (쉼표 구분)"><Input {...register("category")} /></Field>
        <Field label="테마 (쉼표 구분)"><Input {...register("themes")} /></Field>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">위치</h2>
        <Field label="주소"><Input {...register("address")} /></Field>
        <Field label="상세 주소"><Input {...register("address_detail")} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="도/광역시"><Input {...register("region_province")} /></Field>
          <Field label="시/군/구"><Input {...register("region_city")} /></Field>
        </div>
        <Field label="우편번호"><Input {...register("postal_code")} /></Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="위도"><Input {...register("latitude")} type="number" step="any" /></Field>
          <Field label="경도"><Input {...register("longitude")} type="number" step="any" /></Field>
          <Field label="고도(m)"><Input {...register("altitude")} type="number" step="any" /></Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">시설 / 정책</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="유료 여부">
            <select {...register("is_fee_required")} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
              <option value="">-</option>
              <option value="true">유료</option>
              <option value="false">무료</option>
            </select>
          </Field>
          <Field label="반려동물 허용">
            <select {...register("is_pet_allowed")} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
              <option value="">-</option>
              <option value="true">허용</option>
              <option value="false">불가</option>
            </select>
          </Field>
        </div>
        <Field label="반려동물 정책"><Input {...register("pet_policy")} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="사이트 수"><Input {...register("unit_count")} type="number" /></Field>
          <Field label="총 면적(㎡)"><Input {...register("total_area_m2")} type="number" step="any" /></Field>
        </div>
        <Field label="화로 유형"><Input {...register("fire_pit_type")} /></Field>
        <Field label="사이트 유형"><Input {...register("camp_sight_type")} /></Field>
        <Field label="편의시설 (쉼표 구분)"><Input {...register("amenities")} /></Field>
        <Field label="주변 시설 (쉼표 구분)"><Input {...register("nearby_facilities")} /></Field>
        <Field label="렌탈 장비 (쉼표 구분)"><Input {...register("has_equipment_rental")} /></Field>
        <Field label="특이사항"><Textarea {...register("features")} rows={3} /></Field>
        <Field label="배상책임보험">
          <select {...register("has_liability_insurance")} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
            <option value="">-</option>
            <option value="true">가입</option>
            <option value="false">미가입</option>
          </select>
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">연락처 / 링크</h2>
        <Field label="전화번호"><Input {...register("phone")} /></Field>
        <Field label="웹사이트"><Input {...register("website_url")} type="url" /></Field>
        <Field label="예약 링크"><Input {...register("booking_url")} type="url" /></Field>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중…" : "저장"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/spots")}>
          취소
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
