"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { searchSpots } from "@/lib/actions/spot-search";
import type { SpotAdminSearchResult } from "@/lib/types";

/** 스팟 검색 후 담아두는 다중 선택 — 칩 목록(제목+지역+X), 선택 시 자체 상태로 표시용 데이터도 함께 보관 */
export function SpotPicker({
  value,
  onChange,
  excludeUids = [],
}: {
  value: string[];
  onChange: (uids: string[]) => void;
  excludeUids?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotAdminSearchResult[]>([]);
  const [staged, setStaged] = useState<SpotAdminSearchResult[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchSpots(q).then(setResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hiddenUids = new Set([...value, ...excludeUids]);
  const visibleResults = results.filter((s) => !hiddenUids.has(s.uid));

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
