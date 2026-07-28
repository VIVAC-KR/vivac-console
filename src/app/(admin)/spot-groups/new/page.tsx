import Link from "next/link";
import { redirect } from "next/navigation";
import { apiCreate, apiCreateWithResult } from "@/lib/api";
import type { SpotGroupAdminDetail } from "@/lib/types";
import { SpotGroupCreateForm } from "@/components/admin/spot-group-create-form";

async function createGroupAction(data: {
  name: string;
  description: string | null;
  visibility: string;
  spot_uids: string[];
}) {
  "use server";
  const { data: created, error } = await apiCreateWithResult<SpotGroupAdminDetail>(
    "/internal/groups",
    {
      name: data.name,
      description: data.description,
      visibility: data.visibility,
    }
  );
  if (error || !created) {
    redirect(`/spot-groups/new?error=${encodeURIComponent(error ?? "그룹 생성 실패")}`);
  }

  let failCount = 0;
  for (const spotUid of data.spot_uids) {
    const spotError = await apiCreate(
      `/internal/groups/${encodeURIComponent(created.uid)}/spots`,
      { spot_uid: spotUid }
    );
    if (spotError) failCount++;
  }

  const total = data.spot_uids.length;
  const query =
    failCount > 0
      ? `?saved=1&error=${encodeURIComponent(
          `스팟 ${total - failCount}/${total}개 추가됨 (${failCount}개 실패)`
        )}`
      : "?saved=1";
  redirect(`/spot-groups/${created.uid}/edit${query}`);
}

export default async function SpotGroupNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/spot-groups" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Spot Groups 목록
        </Link>
        <h1 className="mt-2 text-xl font-semibold">새 Spot Group</h1>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive break-all"
        >
          {error}
        </div>
      )}

      <SpotGroupCreateForm onCreate={createGroupAction} />
    </div>
  );
}
