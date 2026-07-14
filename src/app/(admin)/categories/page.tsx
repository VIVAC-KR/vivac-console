import { redirect } from "next/navigation";
import { apiFetch, apiCreate, apiDelete } from "@/lib/api";
import type { CategoryOption } from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";

async function createCategoryAction(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim();
  const label_ko = String(formData.get("label_ko") ?? "").trim();
  const error = await apiCreate("/internal/categories", { code, label_ko });
  redirect(
    error ? `/categories?error=${encodeURIComponent(error)}` : "/categories?saved=1"
  );
}

async function deleteCategoryAction(code: string) {
  "use server";
  const error = await apiDelete(`/internal/categories/${encodeURIComponent(code)}`);
  redirect(
    error ? `/categories?error=${encodeURIComponent(error)}` : "/categories?saved=1"
  );
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const categories = await apiFetch<CategoryOption[]>("/internal/categories");

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

      <h1 className="text-xl font-semibold">
        Categories <span className="text-zinc-400 text-base font-normal">{categories.length}개</span>
      </h1>
      <p className="text-sm text-zinc-500">
        스팟 편집 화면의 &ldquo;카테고리&rdquo; 드롭다운에 나오는 값입니다. 삭제하면 모든 스팟의
        카테고리에서도 함께 제거됩니다.
      </p>

      <form
        action={createCategoryAction}
        className="flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-end sm:gap-3"
      >
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
            {categories.map((c) => (
              <TableRow key={c.code}>
                <TableCell className="font-mono text-xs text-zinc-500">{c.code}</TableCell>
                <TableCell>{c.label_ko}</TableCell>
                <TableCell className="text-right">
                  <DeleteCategoryButton code={c.code} action={deleteCategoryAction} />
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-400 py-12">
                  등록된 카테고리 없음
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
