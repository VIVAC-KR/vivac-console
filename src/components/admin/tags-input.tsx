"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** 자유 입력 멀티 셀렉트 — 값을 칩으로 표시, Enter/쉼표로 추가, X/Backspace로 삭제 */
export function TagsInput({
  value,
  onChange,
  placeholder = "입력 후 Enter",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length) onChange([...new Set([...value, ...items])]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            aria-label={`${tag} 제거`}
            onClick={() => remove(tag)}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (draft.trim()) add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            remove(value[value.length - 1]);
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[6rem] flex-1 bg-transparent py-0.5 text-sm outline-none"
      />
    </div>
  );
}
