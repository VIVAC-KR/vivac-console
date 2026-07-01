"use client";

import { useEffect, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const OPTIONS: { value: Theme; icon: typeof Monitor; label: string }[] = [
  { value: "system", icon: Monitor, label: "시스템" },
  { value: "light", icon: Sun, label: "라이트" },
  { value: "dark", icon: Moon, label: "다크" },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // 마운트 시 저장값으로 표시 동기화 (실제 적용은 head 인라인 스크립트가 이미 함).
  // effect에서 읽는 이유: SSR/클라 첫 렌더를 "system"으로 맞춰 하이드레이션 불일치를 피함.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme((localStorage.getItem("theme") as Theme) || "system");
  }, []);

  // system 모드일 때만 OS 테마 변경에 반응
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function select(next: Theme) {
    localStorage.setItem("theme", next);
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="flex gap-1 rounded-md border p-1">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => select(value)}
          title={label}
          aria-label={label}
          className={cn(
            "flex flex-1 items-center justify-center rounded px-2 py-1.5 transition-colors",
            theme === value
              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
