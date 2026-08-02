"use client";

import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { searchGroups } from "@/lib/actions/search";
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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      // 이미 소속된 그룹은 클라이언트에서 걸러내므로 그만큼 여유분을 더 받아온다
      searchGroups(q, 10 + excludeUids.length)
        .then((rows) => {
          if (cancelled) return;
          setResults(rows);
          setError(null);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setError("검색에 실패했습니다.");
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, excludeUids.length]);

  // 입력이 비면 직전 결과를 숨긴다 (effect에서 동기 setState 하지 않기 위해 렌더에서 처리)
  const visibleResults = query.trim()
    ? results.filter((g) => !excludeUids.includes(g.uid))
    : [];

  return (
    <div className="relative max-w-sm">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="그룹 이름 검색…"
        disabled={isPending}
      />
      {query.trim() && error && <p className="mt-1 text-xs text-destructive">{error}</p>}
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
