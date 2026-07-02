"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ProvinceFilter({
  provinces,
  value,
}: {
  provinces: string[];
  value?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) params.set("region_province", e.target.value);
    else params.delete("region_province");
    params.set("page", "1");
    router.push(`${pathname}?${params}`);
  }

  return (
    <select
      value={value ?? ""}
      onChange={onChange}
      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm sm:w-auto"
    >
      <option value="">전체</option>
      {provinces.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
