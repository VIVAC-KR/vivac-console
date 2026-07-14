"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CategoryOption } from "@/lib/types";

/** 고정 목록(카테고리 관리 화면에서 등록된 값)에서만 고르는 다중 선택 — 값을 칩으로 표시, select로 추가 */
export function CategorySelect({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: CategoryOption[];
}) {
  const labelFor = (code: string) =>
    options.find((o) => o.code === code)?.label_ko ?? code;
  const remaining = options.filter((o) => !value.includes(o.code));

  function remove(code: string) {
    onChange(value.filter((c) => c !== code));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
      {value.map((code) => (
        <Badge key={code} variant="secondary" className="gap-1">
          {labelFor(code)}
          <button
            type="button"
            aria-label={`${labelFor(code)} 제거`}
            onClick={() => remove(code)}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <select
        value=""
        onChange={(e) => e.target.value && onChange([...value, e.target.value])}
        disabled={remaining.length === 0}
        className="min-w-[6rem] flex-1 bg-transparent py-0.5 text-sm outline-none disabled:text-zinc-400"
      >
        <option value="" disabled>
          {remaining.length ? "추가..." : "선택 가능한 항목 없음"}
        </option>
        {remaining.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label_ko}
          </option>
        ))}
      </select>
    </div>
  );
}
