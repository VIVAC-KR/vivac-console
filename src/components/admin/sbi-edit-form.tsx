"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

export function SbiEditForm({
  info,
  onSave,
}: {
  info: BusinessInfoDetail;
  onSave: (uid: string, data: Record<string, unknown>) => Promise<string | null>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      business_reg_no: info.business_reg_no ?? "",
      tourism_business_reg_no: info.tourism_business_reg_no ?? "",
      business_type: info.business_type ?? "",
      operation_type: info.operation_type ?? "",
      operating_agency: info.operating_agency ?? "",
      operating_status: info.operating_status ?? "",
      national_park_no: info.national_park_no?.toString() ?? "",
      national_park_office_code: info.national_park_office_code ?? "",
      national_park_serial_no: info.national_park_serial_no ?? "",
      national_park_category_code: info.national_park_category_code ?? "",
      licensed_at: info.licensed_at ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    startTransition(async () => {
      const result = await onSave(info.uid, {
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
      if (result) {
        setError(result);
        return;
      }
      router.push("/spot-business-info?saved=1");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive break-all"
        >
          {error}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">사업자 정보</h2>
        <Field label="사업자 등록번호"><Input {...register("business_reg_no")} /></Field>
        <Field label="관광사업 등록번호"><Input {...register("tourism_business_reg_no")} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="사업유형"><Input {...register("business_type")} /></Field>
          <Field label="운영유형"><Input {...register("operation_type")} /></Field>
        </div>
        <Field label="운영기관"><Input {...register("operating_agency")} /></Field>
        <Field label="운영상태"><Input {...register("operating_status")} /></Field>
        <Field label="허가일"><Input {...register("licensed_at")} type="date" /></Field>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">국립공원</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="국립공원 번호"><Input {...register("national_park_no")} type="number" /></Field>
          <Field label="사무소 코드"><Input {...register("national_park_office_code")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="일련번호"><Input {...register("national_park_serial_no")} /></Field>
          <Field label="카테고리 코드"><Input {...register("national_park_category_code")} /></Field>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중…" : "저장"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/spot-business-info")}>
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
