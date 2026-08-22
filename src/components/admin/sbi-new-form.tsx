"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { searchSpots } from "@/lib/actions/search";

type SpotRef = {
  uid: string;
  title: string;
  region_province: string | null;
  region_city: string | null;
};

type FormValues = {
  business_reg_no: string;
  tourism_business_reg_no: string;
  business_type: string;
  operation_type: string;
  operating_agency: string;
  operating_status: string;
  national_park_no: string;
  national_park_office_code: string;
  national_park_serial_no: string;
  national_park_category_code: string;
  licensed_at: string;
};

export function SbiNewForm({
  initialSpot,
  onCreate,
}: {
  initialSpot: SpotRef | null;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [spot, setSpot] = useState<SpotRef | null>(initialSpot);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotRef[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      business_reg_no: "",
      tourism_business_reg_no: "",
      business_type: "",
      operation_type: "",
      operating_agency: "",
      operating_status: "",
      national_park_no: "",
      national_park_office_code: "",
      national_park_serial_no: "",
      national_park_category_code: "",
      licensed_at: "",
    },
  });

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchSpots(q, 10)
        .then((rows) => {
          if (cancelled) return;
          setResults(rows);
          setSearchError(null);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setSearchError("검색에 실패했습니다.");
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function onSubmit(values: FormValues) {
    if (!spot) return;
    startTransition(async () => {
      await onCreate({
        spot_uid: spot.uid,
        business_reg_no: values.business_reg_no || null,
        tourism_business_reg_no: values.tourism_business_reg_no || null,
        business_type: values.business_type || null,
        operation_type: values.operation_type || null,
        operating_agency: values.operating_agency || null,
        operating_status: values.operating_status || null,
        national_park_no: values.national_park_no
          ? parseInt(values.national_park_no)
          : null,
        national_park_office_code: values.national_park_office_code || null,
        national_park_serial_no: values.national_park_serial_no || null,
        national_park_category_code: values.national_park_category_code || null,
        licensed_at: values.licensed_at || null,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">스팟</h2>
        <Field label="스팟 *">
          {spot ? (
            <Badge variant="secondary" className="w-fit gap-1.5">
              {spot.title}
              {(spot.region_province || spot.region_city) && (
                <span className="text-zinc-400">
                  ({[spot.region_province, spot.region_city].filter(Boolean).join(" ")})
                </span>
              )}
              <button
                type="button"
                aria-label="스팟 선택 해제"
                onClick={() => setSpot(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : (
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="스팟 이름 검색…"
              />
              {query.trim() && searchError && (
                <p className="mt-1 text-xs text-destructive">{searchError}</p>
              )}
              {query.trim() && results.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
                  {results.map((s) => (
                    <li key={s.uid}>
                      <button
                        type="button"
                        onClick={() => {
                          setSpot(s);
                          setQuery("");
                          setResults([]);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between gap-2"
                      >
                        <span>{s.title}</span>
                        <span className="text-xs text-zinc-400">
                          {[s.region_province, s.region_city].filter(Boolean).join(" ") || "-"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Field>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">사업자 정보</h2>
        <Field label="사업자 등록번호"><Input {...register("business_reg_no")} /></Field>
        <Field label="관광사업 등록번호"><Input {...register("tourism_business_reg_no")} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="사업유형"><Input {...register("business_type")} /></Field>
          <Field label="운영유형"><Input {...register("operation_type")} /></Field>
        </div>
        <Field label="운영기관"><Input {...register("operating_agency")} /></Field>
        <Field label="운영상태"><Input {...register("operating_status")} /></Field>
        <Field label="허가일"><Input {...register("licensed_at")} type="date" /></Field>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">국립공원</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="국립공원 번호"><Input {...register("national_park_no")} type="number" /></Field>
          <Field label="사무소 코드"><Input {...register("national_park_office_code")} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="일련번호"><Input {...register("national_park_serial_no")} /></Field>
          <Field label="카테고리 코드"><Input {...register("national_park_category_code")} /></Field>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending || !spot}>
          {isPending ? "생성 중…" : "생성"}
        </Button>
      </div>
    </form>
  );
}
