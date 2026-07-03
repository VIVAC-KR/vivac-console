"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

/** 범용 단일 필드 필터 드롭다운 — 변경 시 해당 쿼리 파라미터만 갱신, page 리셋, 나머지 보존 */
export function FacetFilter({
  label,
  param,
  options,
  value,
}: {
  label: string;
  param: string;
  options: string[];
  value?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(v: string) {
    const next = new URLSearchParams(searchParams);
    if (v) next.set(param, v);
    else next.delete(param);
    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm sm:w-auto"
    >
      <option value="">{label} 전체</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
