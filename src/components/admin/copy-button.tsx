"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** 클립보드 복사 버튼 — 클릭 시 value를 복사하고 잠깐 체크 아이콘으로 피드백 */
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="복사"
      title="복사"
      className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
