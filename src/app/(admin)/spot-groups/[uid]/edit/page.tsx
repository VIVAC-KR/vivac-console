import Link from "next/link";
import {
  apiFetch,
  apiFetchOr404,
  apiMutate,
  apiCreate,
  apiDelete,
  redirectResult,
} from "@/lib/api";
import { fmtDate } from "@/lib/utils";
import {
  SPOT_GROUP_ROLES,
  type SpotGroupAdminDetail,
  type SpotGroupAdminMemberOut,
  type SpotGroupSpotItem,
} from "@/lib/types";
import {
  EmptyRow,
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
import { Pager } from "@/components/ui/pager";
import { StatusBanner } from "@/components/ui/status-banner";
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
  // 삭제 성공 시엔 상세가 사라지므로 목록으로 돌아간다.
  redirectResult(error ? `/spot-groups/${uid}/edit` : "/spot-groups", error);
}

async function addMemberAction(uid: string, formData: FormData) {
  "use server";
  const user_uid = String(formData.get("user_uid") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer");
  const error = await apiCreate(`/internal/groups/${encodeURIComponent(uid)}/members`, {
    user_uid,
    role,
  });
  redirectResult(`/spot-groups/${uid}/edit`, error);
}

async function updateMemberRoleAction(uid: string, userUid: string, formData: FormData) {
  "use server";
  const role = String(formData.get("role") ?? "");
  const error = await apiMutate(
    `/internal/groups/${encodeURIComponent(uid)}/members/${encodeURIComponent(userUid)}`,
    { role }
  );
  redirectResult(`/spot-groups/${uid}/edit`, error);
}

async function removeMemberAction(uid: string, userUid: string) {
  "use server";
  const error = await apiDelete(
    `/internal/groups/${encodeURIComponent(uid)}/members/${encodeURIComponent(userUid)}`
  );
  redirectResult(`/spot-groups/${uid}/edit`, error);
}

async function removeSpotAction(uid: string, spotUid: string, spotsOffset: number) {
  "use server";
  const error = await apiDelete(
    `/internal/groups/${encodeURIComponent(uid)}/spots/${encodeURIComponent(spotUid)}`
  );
  // 보고 있던 스팟 페이지를 유지한다 (제거할 때마다 1페이지로 튕기지 않게).
  redirectResult(
    `/spot-groups/${uid}/edit${spotsOffset ? `?spots_offset=${spotsOffset}` : ""}`,
    error
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

  const group = await apiFetchOr404<SpotGroupAdminDetail>(`/internal/groups/${encodedUid}`);

  // 스팟을 지워 페이지 수가 줄어도 빈 화면에 갇히지 않도록 마지막 페이지로 당긴다
  const lastOffset =
    Math.max(0, Math.ceil(group.spot_count / SPOTS_PAGE_SIZE) - 1) * SPOTS_PAGE_SIZE;
  const spotsOffset = Math.min(
    Math.max(0, parseInt(spots_offset ?? "0", 10) || 0),
    lastOffset
  );

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
      <StatusBanner saved={saved} error={error} />

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
                      {fmtDate(member.created_at)}
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
              {members.length === 0 && <EmptyRow colSpan={5}>멤버 없음</EmptyRow>}
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
                const removeSpotForSpot = removeSpotAction.bind(null, uid, spot.uid, spotsOffset);
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
                      {fmtDate(spot.added_at)}
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
              {spots.length === 0 && <EmptyRow colSpan={6}>스팟 없음</EmptyRow>}
            </TableBody>
          </Table>
        </div>

        <Pager
          page={Math.floor(spotsOffset / SPOTS_PAGE_SIZE) + 1}
          totalPages={Math.ceil(group.spot_count / SPOTS_PAGE_SIZE)}
          href={(p) => `/spot-groups/${uid}/edit?spots_offset=${(p - 1) * SPOTS_PAGE_SIZE}`}
        />
      </section>
    </div>
  );
}
