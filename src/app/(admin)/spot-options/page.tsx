import Link from "next/link";
import { apiFetch, apiCreate, apiDelete, redirectResult } from "@/lib/api";
import type { SpotOption, SpotOptionField } from "@/lib/types";
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";

const FIELD_TABS: { field: SpotOptionField; label: string }[] = [
  { field: "category", label: "카테고리" },
  { field: "amenities", label: "편의시설" },
  { field: "nearby_facilities", label: "주변 시설" },
  { field: "has_equipment_rental", label: "렌탈 장비" },
];

async function createOptionAction(formData: FormData) {
  "use server";
  const field = String(formData.get("field") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const label_ko = String(formData.get("label_ko") ?? "").trim();
  const error = await apiCreate("/internal/spot-options", { field, code, label_ko });
  redirectResult(`/spot-options?field=${encodeURIComponent(field)}`, error);
}

async function deleteOptionAction(field: string, code: string) {
  "use server";
  const error = await apiDelete(
    `/internal/spot-options/${encodeURIComponent(field)}/${encodeURIComponent(code)}`
  );
  redirectResult(`/spot-options?field=${encodeURIComponent(field)}`, error);
}

export default async function SpotOptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string; saved?: string; error?: string }>;
}) {
  const { field: rawField, saved, error } = await searchParams;
  const field: SpotOptionField = FIELD_TABS.some((t) => t.field === rawField)
    ? (rawField as SpotOptionField)
    : "category";
  const options = await apiFetch<SpotOption[]>(
    `/internal/spot-options?field=${field}`
  );

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner saved={saved} error={error} />

      <h1 className="text-xl font-semibold">
        Field Options <span className="text-zinc-400 text-base font-normal">{options.length}개</span>
      </h1>
      <p className="text-sm text-zinc-500">
        스팟 편집 화면의 다중 선택 드롭다운에 나오는 값입니다. 삭제하면 모든 스팟에서도
        함께 제거됩니다.
      </p>

      <div className="flex gap-1 border-b">
        {FIELD_TABS.map((tab) => (
          <Link
            key={tab.field}
            href={`/spot-options?field=${tab.field}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              field === tab.field
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form
        action={createOptionAction}
        className="flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-end sm:gap-3"
      >
        <input type="hidden" name="field" value={field} />
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-sm">코드 *</Label>
          <Input
            name="code"
            placeholder="GLAMPING"
            pattern="[A-Z][A-Z0-9_]*"
            title="대문자로 시작, 대문자/숫자/밑줄만 사용"
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-sm">표시 이름 *</Label>
          <Input name="label_ko" placeholder="글램핑" required />
        </div>
        <Button type="submit">추가</Button>
      </form>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>코드</TableHead>
              <TableHead>표시 이름</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.map((o) => (
              <TableRow key={o.code}>
                <TableCell className="font-mono text-xs text-zinc-500">{o.code}</TableCell>
                <TableCell>{o.label_ko}</TableCell>
                <TableCell className="text-right">
                  <ConfirmActionButton
                    confirmMessage={`"${o.code}" 항목을 삭제하시겠습니까?\n모든 스팟에서도 함께 제거됩니다.`}
                    action={deleteOptionAction.bind(null, field, o.code)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {options.length === 0 && <EmptyRow colSpan={3}>등록된 항목 없음</EmptyRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
