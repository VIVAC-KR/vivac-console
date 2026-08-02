"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { searchSpots } from "@/lib/actions/search";
import type { SpotAdminSearchResult } from "@/lib/types";

/** 스팟 검색 후 담아두는 다중 선택 — 칩 목록(제목+지역+X), 선택 시 자체 상태로 표시용 데이터도 함께 보관 */
export function SpotPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (uids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotAdminSearchResult[]>([]);
  const [staged, setStaged] = useState<SpotAdminSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      // 선택된 항목은 클라이언트에서 걸러내므로 그만큼 여유분을 더 받아온다
      searchSpots(q, 10 + value.length)
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
  }, [query, value.length]);

  const hiddenUids = new Set(value);
  // 입력이 비면 직전 결과를 숨긴다 (effect에서 동기 setState 하지 않기 위해 렌더에서 처리)
  const visibleResults = query.trim()
    ? results.filter((s) => !hiddenUids.has(s.uid))
    : [];

  function pick(spot: SpotAdminSearchResult) {
    setStaged((prev) => [...prev, spot]);
    onChange([...value, spot.uid]);
    setQuery("");
    setResults([]);
  }

  function remove(uid: string) {
    setStaged((prev) => prev.filter((s) => s.uid !== uid));
    onChange(value.filter((u) => u !== uid));
  }

  return (
    <div className="flex flex-col gap-2">
      {staged.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {staged.map((spot) => (
            <Badge key={spot.uid} variant="secondary" className="gap-1">
              {spot.title}
              {(spot.region_province || spot.region_city) && (
                <span className="text-zinc-400">
                  ({[spot.region_province, spot.region_city].filter(Boolean).join(" ")})
                </span>
              )}
              <button
                type="button"
                aria-label={`${spot.title} 제거`}
                onClick={() => remove(spot.uid)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="스팟 이름 검색…"
        />
        {query.trim() && error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        {visibleResults.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
            {visibleResults.map((spot) => (
              <li key={spot.uid}>
                <button
                  type="button"
                  onClick={() => pick(spot)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between gap-2"
                >
                  <span>{spot.title}</span>
                  <span className="text-xs text-zinc-400">
                    {[spot.region_province, spot.region_city].filter(Boolean).join(" ") || "-"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
