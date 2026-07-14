import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { apiFetch, apiMutate, apiCreate, apiDelete, ApiError } from "@/lib/api";
import {
  SPOT_GROUP_ROLES,
  type SpotGroupAdminDetail,
  type SpotGroupAdminMemberOut,
  type SpotGroupSpotItem,
} from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/admin/copy-button";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { SpotGroupEditForm } from "@/components/admin/spot-group-edit-form";

const SPOTS_PAGE_SIZE = 20;

/** 저장 결과: 성공 시 null, 실패 시 에러 메시지 */
async function saveGroupMeta(
  uid: string,
  data: Record<string, unknown>
): Promise<string | null> {
  "use server";
  return apiMutate(`/internal/groups/${encodeURIComponent(uid)}`, data);
}

async function deleteGroupAction(uid: string) {
  "use server";
  const error = await apiDelete(`/internal/groups/${encodeURIComponent(uid)}`);
  redirect(
    error
      ? `/spot-groups/${uid}/edit?error=${encodeURIComponent(error)}`
      : "/spot-groups?saved=1"
  );
}

async function addMemberAction(uid: string, formData: FormData) {
  "use server";
  const user_uid = String(formData.get("user_uid") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer");
  const error = await apiCreate(`/internal/groups/${encodeURIComponent(uid)}/members`, {
    user_uid,
    role,
  });
  redirect(
    error
      ? `/spot-groups/${uid}/edit?error=${encodeURIComponent(error)}`
      : `/spot-groups/${uid}/edit?saved=1`
  );
}

async function updateMemberRoleAction(uid: string, userUid: string, formData: FormData) {
  "use server";
  const role = String(formData.get("role") ?? "");
  const error = await apiMutate(
    `/internal/groups/${encodeURIComponent(uid)}/members/${encodeURIComponent(userUid)}`,
    { role }
  );
  redirect(
    error
      ? `/spot-groups/${uid}/edit?error=${encodeURIComponent(error)}`
      : `/spot-groups/${uid}/edit?saved=1`
  );
}

async function removeMemberAction(uid: string, userUid: string) {
  "use server";
  const error = await apiDelete(
    `/internal/groups/${encodeURIComponent(uid)}/members/${encodeURIComponent(userUid)}`
  );
  redirect(
    error
      ? `/spot-groups/${uid}/edit?error=${encodeURIComponent(error)}`
      : `/spot-groups/${uid}/edit?saved=1`
  );
}

async function removeSpotAction(uid: string, spotUid: string) {
  "use server";
  const error = await apiDelete(
    `/internal/groups/${encodeURIComponent(uid)}/spots/${encodeURIComponent(spotUid)}`
  );
  redirect(
    error
      ? `/spot-groups/${uid}/edit?error=${encodeURIComponent(error)}`
      : `/spot-groups/${uid}/edit?saved=1`
  );
}

export default async function SpotGroupEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ uid: string }>;
  searchParams: Promise<{ saved?: string; error?: string; spots_offset?: string }>;
}) {
  const { uid } = await params;
  const encodedUid = encodeURIComponent(uid);
  const { saved, error, spots_offset } = await searchParams;
  const spotsOffset = Math.max(0, parseInt(spots_offset ?? "0", 10) || 0);

  let group: SpotGroupAdminDetail;
  try {
    group = await apiFetch<SpotGroupAdminDetail>(`/internal/groups/${encodedUid}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [members, spots] = await Promise.all([
    apiFetch<SpotGroupAdminMemberOut[]>(`/internal/groups/${encodedUid}/members`),
    apiFetch<SpotGroupSpotItem[]>(
      `/internal/groups/${encodedUid}/spots?offset=${spotsOffset}&limit=${SPOTS_PAGE_SIZE}`
    ),
  ]);

  const addMemberActionForGroup = addMemberAction.bind(null, uid);
  const deleteGroupActionForGroup = deleteGroupAction.bind(null, uid);

  return (
    <div className="flex flex-col gap-6">
      {saved && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          저장되었습니다.
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

      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/spot-groups" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Spot Groups 목록
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{group.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
            <span>UID: {group.uid}</span>
            <CopyButton value={group.uid} />
          </p>
        </div>
        <ConfirmActionButton
          confirmMessage={`"${group.name}" 그룹을 삭제하시겠습니까?\n멤버/스팟 매핑이 모두 함께 삭제되며 되돌릴 수 없습니다.`}
          action={deleteGroupActionForGroup}
          variant="destructive"
        >
          그룹 삭제
        </ConfirmActionButton>
      </div>

      <SpotGroupEditForm group={group} onSave={saveGroupMeta} />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
          멤버 <span className="text-zinc-400 font-normal normal-case">{members.length}명</span>
        </h2>

        <form
          action={addMemberActionForGroup}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-sm">유저 UID *</Label>
            <Input name="user_uid" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">역할</Label>
            <select
              name="role"
              defaultValue="viewer"
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {SPOT_GROUP_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <Button type="submit">강제 추가</Button>
        </form>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>닉네임</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const updateRoleForMember = updateMemberRoleAction.bind(null, uid, member.user_uid);
                const removeMemberForMember = removeMemberAction.bind(null, uid, member.user_uid);
                return (
                  <TableRow key={member.user_uid}>
                    <TableCell className="font-medium">{member.nickname}</TableCell>
                    <TableCell className="text-zinc-500 text-xs">{member.email}</TableCell>
                    <TableCell>
                      <form action={updateRoleForMember} className="flex items-center gap-1.5">
                        <select
                          name="role"
                          defaultValue={member.role}
                          className="h-8 rounded-md border bg-transparent px-2 text-xs"
                        >
                          {SPOT_GROUP_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <Button type="submit" variant="ghost" size="sm">변경</Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString("ko-KR") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfirmActionButton
                        confirmMessage={`"${member.nickname}"을(를) 그룹에서 제거하시겠습니까?`}
                        action={removeMemberForMember}
                      >
                        제거
                      </ConfirmActionButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-400 py-8">
                    멤버 없음
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
          스팟 <span className="text-zinc-400 font-normal normal-case">{group.spot_count}개</span>
        </h2>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>지역</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>추가자</TableHead>
                <TableHead>추가일</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {spots.map((spot) => {
                const removeSpotForSpot = removeSpotAction.bind(null, uid, spot.uid);
                return (
                  <TableRow key={spot.uid}>
                    <TableCell>
                      <Link href={`/spots/${spot.uid}/edit`} className="text-blue-600 hover:underline">
                        {spot.title}
                      </Link>
                    </TableCell>
                    <TableCell>{spot.region_short ?? "-"}</TableCell>
                    <TableCell>
                      {spot.category?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {spot.category.map((c) => (
                            <Badge key={c} variant="secondary">{c}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">{spot.added_by_uid}</TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {spot.added_at ? new Date(spot.added_at).toLocaleDateString("ko-KR") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfirmActionButton
                        confirmMessage={`"${spot.title}"을(를) 그룹에서 제거하시겠습니까?`}
                        action={removeSpotForSpot}
                      >
                        제거
                      </ConfirmActionButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {spots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-400 py-8">
                    스팟 없음
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {(spotsOffset > 0 || spots.length === SPOTS_PAGE_SIZE) && (
          <div className="flex items-center gap-2 text-sm">
            {spotsOffset > 0 && (
              <Link
                href={`/spot-groups/${uid}/edit?spots_offset=${Math.max(0, spotsOffset - SPOTS_PAGE_SIZE)}`}
                className="px-3 py-1 border rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                이전
              </Link>
            )}
            {spots.length === SPOTS_PAGE_SIZE && (
              <Link
                href={`/spot-groups/${uid}/edit?spots_offset=${spotsOffset + SPOTS_PAGE_SIZE}`}
                className="px-3 py-1 border rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                다음
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
