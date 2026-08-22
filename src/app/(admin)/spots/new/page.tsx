import Link from "next/link";
import { redirect } from "next/navigation";
import { apiCreateWithResult, apiFetch } from "@/lib/api";
import type { SpotOption } from "@/lib/types";
import { SpotNewForm } from "@/components/admin/spot-new-form";
import { StatusBanner } from "@/components/ui/status-banner";

async function createSpotAction(data: Record<string, unknown>) {
  "use server";
  const { data: created, error } = await apiCreateWithResult<{ uid: string }>(
    "/internal/spots",
    data
  );
  if (error || !created) {
    redirect(`/spots/new?error=${encodeURIComponent(error ?? "스팟 생성 실패")}`);
  }
  redirect(`/spots/${created.uid}/edit?saved=1`);
}

export default async function SpotNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const category = await apiFetch<SpotOption[]>("/internal/spot-options?field=category");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/spots" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Spots 목록
        </Link>
        <h1 className="mt-2 text-xl font-semibold">새 Spot</h1>
      </div>

      <StatusBanner error={error} />

      <SpotNewForm categoryOptions={category} onCreate={createSpotAction} />
    </div>
  );
}
