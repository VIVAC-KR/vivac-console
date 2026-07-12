"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/admin/theme-toggle";

// 그룹별 네비게이션 (섹션 헤더로 스팟/기타 데이터 분리)
const NAV_GROUPS: { title?: string; items: { href: string; label: string }[] }[] = [
  { items: [{ href: "/dashboard", label: "대시보드" }] },
  {
    title: "스팟",
    items: [
      { href: "/spots", label: "Spots" },
      { href: "/spots?pipeline_status=ENRICHED", label: "검증 대기" },
    ],
  },
  {
    title: "기타 데이터",
    items: [{ href: "/spot-business-info", label: "Business Info" }],
  },
];

export function AdminShell({
  email,
  signOutAction,
  children,
}: {
  email?: string | null;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deskCollapsed, setDeskCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Backdrop (모바일 드로어 열렸을 때) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — 모바일: 슬라이드 드로어 / 데스크톱: 고정(접기 가능) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-zinc-50 transition-transform dark:bg-zinc-950 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          deskCollapsed && "md:hidden"
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-5">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight transition-opacity hover:opacity-70"
            onClick={() => setMobileOpen(false)}
          >
            VIVAC
          </Link>
          {/* 모바일 닫기 */}
          <button
            className="md:hidden"
            aria-label="메뉴 닫기"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
          {/* 데스크톱 접기 */}
          <button
            className="hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 md:inline-flex"
            aria-label="사이드바 접기"
            onClick={() => setDeskCollapsed(true)}
          >
            <PanelLeftClose className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-4 p-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.title ?? gi} className="flex flex-col gap-1">
              {group.title && (
                <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-3 border-t p-3">
          <ThemeToggle />
          <p className="truncate text-xs text-zinc-500">{email}</p>
          <form action={signOutAction}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full justify-start text-xs"
            >
              로그아웃
            </Button>
          </form>
        </div>
      </aside>

      {/* Main 컬럼 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 상단바 — 모바일 항상 / 데스크톱은 접혔을 때만 */}
        <header
          className={cn(
            "flex h-14 items-center gap-3 border-b px-4 md:hidden",
            deskCollapsed && "md:flex"
          )}
        >
          {/* 모바일 햄버거 */}
          <button
            className="md:hidden"
            aria-label="메뉴 열기"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          {/* 데스크톱 펼치기 (접힌 상태에서만 보임) */}
          <button
            className="hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 md:inline-flex"
            aria-label="사이드바 펼치기"
            onClick={() => setDeskCollapsed(false)}
          >
            <PanelLeftOpen className="size-5" />
          </button>
          <span className="text-sm font-semibold tracking-tight">VIVAC</span>
        </header>

        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
