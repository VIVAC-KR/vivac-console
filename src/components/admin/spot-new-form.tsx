"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { OptionMultiSelect } from "@/components/admin/option-multi-select";
import type { SpotOption } from "@/lib/types";

type FormValues = {
  title: string;
  tagline: string;
  description: string;
  category: string[];
  phone: string;
  website_url: string;
  booking_url: string;
  address: string;
  address_detail: string;
  region_province: string;
  region_city: string;
  postal_code: string;
};

export function SpotNewForm({
  categoryOptions,
  onCreate,
}: {
  categoryOptions: SpotOption[];
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      title: "",
      tagline: "",
      description: "",
      category: [],
      phone: "",
      website_url: "",
      booking_url: "",
      address: "",
      address_detail: "",
      region_province: "",
      region_city: "",
      postal_code: "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await onCreate({
        title: values.title,
        tagline: values.tagline || null,
        description: values.description || null,
        category: values.category.length ? values.category : null,
        phone: values.phone.trim() || null,
        website_url: values.website_url || null,
        booking_url: values.booking_url || null,
        address: values.address || null,
        address_detail: values.address_detail || null,
        region_province: values.region_province || null,
        region_city: values.region_city || null,
        postal_code: values.postal_code || null,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">기본 정보</h2>
        <Field label="이름 *"><Input {...register("title")} required /></Field>
        <Field label="한줄설명"><Input {...register("tagline")} /></Field>
        <Field label="설명"><Textarea {...register("description")} rows={4} /></Field>
        <Field label="카테고리">
          <OptionMultiSelect
            value={watch("category")}
            onChange={(v) => setValue("category", v, { shouldDirty: true })}
            options={categoryOptions}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">연락처 / 링크</h2>
        <Field label="전화번호"><Input {...register("phone")} /></Field>
        <Field label="웹사이트"><Input {...register("website_url")} type="url" /></Field>
        <Field label="예약 링크"><Input {...register("booking_url")} type="url" /></Field>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">위치</h2>
        <Field label="주소"><Input {...register("address")} /></Field>
        <Field label="상세 주소"><Input {...register("address_detail")} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="도/광역시"><Input {...register("region_province")} /></Field>
          <Field label="시/군/구"><Input {...register("region_city")} /></Field>
        </div>
        <Field label="우편번호"><Input {...register("postal_code")} /></Field>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "생성 중…" : "생성"}
        </Button>
      </div>
    </form>
  );
}
