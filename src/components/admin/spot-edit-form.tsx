"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TagsInput } from "@/components/admin/tags-input";
import { OptionMultiSelect } from "@/components/admin/option-multi-select";
import type { SpotDetail, SpotOption } from "@/lib/types";

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
  amenities: string[];
  nearby_facilities: string[];
  camp_sight_type: string;
  has_equipment_rental: string[];
  website_url: string;
  booking_url: string;
  features: string;
  category: string[];
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
  currentUserId,
  fieldOptions,
  onSave,
}: {
  spot: SpotDetail;
  currentUserId?: string;
  fieldOptions: {
    category: SpotOption[];
    amenities: SpotOption[];
    nearby_facilities: SpotOption[];
    has_equipment_rental: SpotOption[];
  };
  onSave: (uid: string, data: Record<string, unknown>) => Promise<string | null>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // 클릭된 버튼(저장/제출/반려)에 따라 함께 보낼 pipeline_status. 각 버튼 onClick에서 세팅.
  const pendingStatusRef = useRef<"CURATED" | "REJECTED" | null>(null);
  // 제출/반려는 ENRICHED 상태 + 내게 할당된 항목에서만 (backend PATCH도 동일하게 강제)
  const isReviewQueueItem =
    spot.pipeline_status === "ENRICHED" && spot.assigned_to_uid === currentUserId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
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
      amenities: spot.amenities ?? [],
      nearby_facilities: spot.nearby_facilities ?? [],
      camp_sight_type: spot.camp_sight_type ?? "",
      has_equipment_rental: spot.has_equipment_rental ?? [],
      website_url: spot.website_url ?? "",
      booking_url: spot.booking_url ?? "",
      features: spot.features ?? "",
      category: spot.category ?? [],
      total_area_m2: spot.total_area_m2?.toString() ?? "",
      has_liability_insurance: spot.has_liability_insurance?.toString() ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    const status = pendingStatusRef.current;
    startTransition(async () => {
      const result = await onSave(spot.uid, {
        ...(status && { pipeline_status: status }),
        title: values.title || undefined,
        address: values.address || null,
        address_detail: values.address_detail || null,
        region_province: values.region_province || null,
        region_city: values.region_city || null,
        postal_code: values.postal_code || null,
        phone: values.phone.trim() || null,
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
        amenities: values.amenities.length ? values.amenities : null,
        nearby_facilities: values.nearby_facilities.length ? values.nearby_facilities : null,
        camp_sight_type: values.camp_sight_type || null,
        has_equipment_rental: values.has_equipment_rental.length ? values.has_equipment_rental : null,
        website_url: values.website_url || null,
        booking_url: values.booking_url || null,
        features: values.features || null,
        category: values.category.length ? values.category : null,
        total_area_m2: parseNum(values.total_area_m2),
        has_liability_insurance: parseBool(values.has_liability_insurance),
      });
      if (result) {
        setError(result);
        return;
      }
      router.push(
        status ? "/spots?pipeline_status=ENRICHED&saved=1" : "/spots?saved=1"
      );
    });
  }

  // 배열 필드용 태그 멀티셀렉트 바인딩 (내부 표현은 쉼표 문자열 유지)
  // — category/amenities/nearby_facilities/has_equipment_rental는 OptionMultiSelect로 별도 처리
  const tagsField = (
    name: Exclude<
      keyof FormValues,
      "category" | "amenities" | "nearby_facilities" | "has_equipment_rental"
    >
  ) => ({
    value: parseArr(watch(name)) ?? [],
    onChange: (v: string[]) =>
      setValue(name, v.join(", "), { shouldDirty: true }),
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        pendingStatusRef.current = null;
      })}
      className="flex flex-col gap-6 max-w-2xl"
    >
      {spot.pipeline_status && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">처리 상태</span>
          <Badge variant={isReviewQueueItem ? "default" : "secondary"}>
            {spot.pipeline_status}
          </Badge>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive break-all"
        >
          {error}
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">기본 정보</h2>
        <Field label="이름 *" extra={<SearchLink q={watch("title")} />}>
          <Input {...register("title")} required />
        </Field>
        <Field label="한줄설명"><Input {...register("tagline")} /></Field>
        <Field label="설명"><Textarea {...register("description")} rows={4} /></Field>
        <Field label="카테고리">
          <OptionMultiSelect
            value={watch("category")}
            onChange={(v) => setValue("category", v, { shouldDirty: true })}
            options={fieldOptions.category}
          />
        </Field>
        <Field label="태그"><TagsInput {...tagsField("themes")} /></Field>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">연락처 / 링크</h2>
        <Field
          label="전화번호"
          extra={<SearchLink q={[watch("title"), watch("phone")].filter(Boolean).join(" ")} />}
        >
          <Input
            {...register("phone", {
              validate: (v) => {
                const t = v.trim();
                return !t || /^\d[\d-]*\d$/.test(t) || "숫자와 하이픈(-)만 입력 가능합니다";
              },
            })}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </Field>
        <Field label="웹사이트" extra={<OpenLink url={watch("website_url")} />}>
          <Input {...register("website_url")} type="url" />
        </Field>
        <Field label="예약 링크"><Input {...register("booking_url")} type="url" /></Field>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">위치</h2>
        <Field
          label="주소"
          extra={<SearchLink q={[watch("title"), watch("address")].filter(Boolean).join(" ")} />}
        >
          <Input {...register("address")} />
        </Field>
        <Field label="상세 주소"><Input {...register("address_detail")} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="도/광역시"><Input {...register("region_province")} /></Field>
          <Field label="시/군/구"><Input {...register("region_city")} /></Field>
        </div>
        <Field label="우편번호"><Input {...register("postal_code")} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="위도"><Input {...register("latitude")} type="number" step="any" /></Field>
          <Field label="경도"><Input {...register("longitude")} type="number" step="any" /></Field>
          <Field label="고도(m)"><Input {...register("altitude")} type="number" step="any" /></Field>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">시설 / 정책</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="사이트 수"><Input {...register("unit_count")} type="number" /></Field>
          <Field label="총 면적(㎡)"><Input {...register("total_area_m2")} type="number" step="any" /></Field>
        </div>
        <Field label="화로 유형"><Input {...register("fire_pit_type")} /></Field>
        <Field label="사이트 유형"><Input {...register("camp_sight_type")} /></Field>
        <Field label="편의시설">
          <OptionMultiSelect
            value={watch("amenities")}
            onChange={(v) => setValue("amenities", v, { shouldDirty: true })}
            options={fieldOptions.amenities}
          />
        </Field>
        <Field label="주변 시설">
          <OptionMultiSelect
            value={watch("nearby_facilities")}
            onChange={(v) => setValue("nearby_facilities", v, { shouldDirty: true })}
            options={fieldOptions.nearby_facilities}
          />
        </Field>
        <Field label="렌탈 장비">
          <OptionMultiSelect
            value={watch("has_equipment_rental")}
            onChange={(v) => setValue("has_equipment_rental", v, { shouldDirty: true })}
            options={fieldOptions.has_equipment_rental}
          />
        </Field>
        <Field label="특이사항"><Textarea {...register("features")} rows={3} /></Field>
        <Field label="배상책임보험">
          <select {...register("has_liability_insurance")} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
            <option value="">-</option>
            <option value="true">가입</option>
            <option value="false">미가입</option>
          </select>
        </Field>
      </section>

      <div className="flex justify-end gap-3 pt-2">
        {!isReviewQueueItem && (
          <Button
            type="submit"
            disabled={isPending}
            onClick={() => (pendingStatusRef.current = null)}
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        )}
        {isReviewQueueItem && (
          <>
            <Button
              type="submit"
              disabled={isPending}
              onClick={() => (pendingStatusRef.current = "CURATED")}
            >
              Submit
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              onClick={() => (pendingStatusRef.current = "REJECTED")}
            >
              Reject
            </Button>
          </>
        )}
        <Button type="button" variant="ghost" onClick={() => router.push("/spots")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  extra,
  children,
}: {
  label: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        {extra}
      </div>
      {children}
    </div>
  );
}

/** 웹사이트 바로가기 — 값이 없거나 URL 형식이 아니면 렌더링하지 않음 */
function OpenLink({ url }: { url: string }) {
  if (!url.trim()) return null;
  try {
    const protocol = new URL(url).protocol;
    if (protocol !== "http:" && protocol !== "https:") return null;
  } catch {
    return null;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:underline"
    >
      열기 ↗
    </a>
  );
}

/** 데이터 검증용 Google 검색 바로가기 — 값이 없으면 렌더링하지 않음 */
function SearchLink({ q }: { q: string }) {
  if (!q.trim()) return null;
  return (
    <a
      href={`https://www.google.com/search?q=${encodeURIComponent(q)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:underline"
    >
      Google 검색 ↗
    </a>
  );
}
