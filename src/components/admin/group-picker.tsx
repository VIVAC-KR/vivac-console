"use client";

import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { searchGroups } from "@/lib/actions/group-search";
import type { SpotGroupAdminListItem } from "@/lib/types";

/** 그룹 검색 후 클릭 즉시 추가 — SpotPicker와 달리 담아뒀다 제출하는 방식이 아니라 바로 서버 액션 호출 */
export function GroupPicker({
  onPick,
  excludeUids = [],
}: {
  onPick: (groupUid: string) => Promise<void>;
  excludeUids?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotGroupAdminListItem[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchGroups(q).then(setResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const visibleResults = results.filter((g) => !excludeUids.includes(g.uid));

  return (
    <div className="relative max-w-sm">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="그룹 이름 검색…"
        disabled={isPending}
      />
      {visibleResults.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          {visibleResults.map((group) => (
            <li key={group.uid}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => onPick(group.uid))}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between gap-2"
              >
                <span>{group.name}</span>
                <span className="text-xs text-zinc-400">{group.visibility}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
