"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SpotPicker } from "@/components/admin/spot-picker";
import { SPOT_GROUP_VISIBILITIES } from "@/lib/types";

type FormValues = {
  name: string;
  description: string;
  visibility: string;
};

export function SpotGroupCreateForm({
  onCreate,
}: {
  onCreate: (data: {
    name: string;
    description: string | null;
    visibility: string;
    spot_uids: string[];
  }) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [spotUids, setSpotUids] = useState<string[]>([]);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: "", description: "", visibility: "private" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await onCreate({
        name: values.name,
        description: values.description || null,
        visibility: values.visibility,
        spot_uids: spotUids,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-lg border p-5 max-w-2xl">
      <Field label="이름 *"><Input {...register("name")} required /></Field>
      <Field label="설명"><Textarea {...register("description")} rows={3} /></Field>
      <Field label="공개범위">
        <select {...register("visibility")} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
          {SPOT_GROUP_VISIBILITIES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="스팟 (선택)">
        <SpotPicker value={spotUids} onChange={setSpotUids} />
      </Field>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "생성 중…" : "생성"}
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
