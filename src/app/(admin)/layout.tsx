import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/admin/theme-toggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r bg-zinc-50 dark:bg-zinc-950 flex flex-col">
        <div className="px-4 py-5 border-b">
          <Link href="/" className="font-semibold text-sm tracking-tight hover:opacity-70 transition-opacity">
            VIVAC
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <Link
            href="/spots"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Spots
          </Link>
          <Link
            href="/spot-business-info"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Business Info
          </Link>
        </nav>
        <div className="p-3 border-t flex flex-col gap-3">
          <ThemeToggle />
          <p className="text-xs text-zinc-500 truncate">{session?.user?.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit" className="w-full justify-start text-xs">
              로그아웃
            </Button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
