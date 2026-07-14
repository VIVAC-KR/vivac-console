"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  ClipboardCheck,
  MapPin,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/admin/theme-toggle";

export function AdminShell({
  email,
  userId,
  signOutAction,
  children,
}: {
  email?: string | null;
  userId?: string | null;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deskCollapsed, setDeskCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 그룹별 네비게이션 — "My Queue"(내게 할당된 검증 대기)를 우선 노출하고 "Browse"(전체 열람)를 그다음에
  const NAV_GROUPS: {
    title?: string;
    items: { href: string; label: string; icon: typeof LayoutDashboard }[];
  }[] = [
    { items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    {
      title: "My Queue",
      items: userId
        ? [
            {
              href: `/spots?pipeline_status=ENRICHED&assigned_to_uid=${userId}`,
              label: "Pending Review",
              icon: ClipboardCheck,
            },
          ]
        : [],
    },
    {
      title: "Browse",
      items: [
        { href: "/spots", label: "Spots", icon: MapPin },
        { href: "/spot-business-info", label: "Business Info", icon: Building2 },
      ],
    },
  ];

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
                const [itemPath, itemQuery] = item.href.split("?");
                // Browse의 "Spots"와 My Queue의 "Pending Review"가 같은 경로(/spots)를
                // 공유하므로, assigned_to_uid 유무로 두 탭을 구분해 동시 활성화를 막는다.
                const itemAssigned = new URLSearchParams(itemQuery).has("assigned_to_uid");
                const currentAssigned = searchParams.has("assigned_to_uid");
                const active =
                  pathname.startsWith(itemPath) && itemAssigned === currentAssigned;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
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
              Log out
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
