"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SPOT_GROUP_VISIBILITIES, type SpotGroupAdminDetail } from "@/lib/types";

type FormValues = {
  name: string;
  description: string;
  visibility: string;
};

export function SpotGroupEditForm({
  group,
  onSave,
}: {
  group: SpotGroupAdminDetail;
  onSave: (uid: string, data: Record<string, unknown>) => Promise<string | null>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: group.name,
      description: group.description ?? "",
      visibility: group.visibility,
    },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    startTransition(async () => {
      const result = await onSave(group.uid, {
        name: values.name,
        description: values.description || null,
        visibility: values.visibility,
      });
      if (result) {
        setError(result);
        return;
      }
      router.push(`/spot-groups/${group.uid}/edit?saved=1`);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-lg border p-5 max-w-2xl">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive break-all"
        >
          {error}
        </div>
      )}
      <Field label="이름 *"><Input {...register("name")} required /></Field>
      <Field label="설명"><Textarea {...register("description")} rows={3} /></Field>
      <Field label="공개범위">
        <select {...register("visibility")} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
          {SPOT_GROUP_VISIBILITIES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </Field>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중…" : "저장"}
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
