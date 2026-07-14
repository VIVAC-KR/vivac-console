import Link from "next/link";
import {
  MapPin,
  Building2,
  AlertTriangle,
  ClipboardCheck,
  ListTodo,
  CheckCircle2,
} from "lucide-react";
import { auth } from "@/auth";
import { apiFetch, apiList } from "@/lib/api";
import { cn } from "@/lib/utils";

type CountItem = { key: string; count: number };
type SpotStats = {
  total: number;
  business_info_total: number;
  missing_coordinates: number;
  by_source: CountItem[];
  by_region_province: CountItem[];
  my_assigned_total: number;
  my_completed: number;
};

export default async function DashboardPage() {
  const session = await auth();
  const [stats, enrichedQueue] = await Promise.all([
    apiFetch<SpotStats>("/internal/spots/stats"),
    apiList<{ uid: string }>("/internal/spots", {
      pipeline_status: "ENRICHED",
      _start: 0,
      _end: 1,
    }),
  ]);
  const myPending = stats.my_assigned_total - stats.my_completed;
  const myCompletionRate =
    stats.my_assigned_total > 0
      ? `${((stats.my_completed / stats.my_assigned_total) * 100).toFixed(1)}%`
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Browse — 전체 데이터 요약 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Browse
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Spots"
            value={stats.total}
            icon={MapPin}
            tint="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Business Info"
            value={stats.business_info_total}
            icon={Building2}
            tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Missing Coordinates"
            value={stats.missing_coordinates}
            icon={AlertTriangle}
            tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            hint={
              stats.total > 0
                ? `${((stats.missing_coordinates / stats.total) * 100).toFixed(1)}%`
                : undefined
            }
          />
          <StatCard
            label="Pending Review (All)"
            value={enrichedQueue.total}
            icon={ClipboardCheck}
            tint="bg-orange-500/10 text-orange-600 dark:text-orange-400"
            href="/spots?pipeline_status=ENRICHED"
          />
        </div>
      </section>

      {/* My Queue — 내게 할당된 데이터 진행률 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          My Queue
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Assigned to Me"
            value={stats.my_assigned_total}
            icon={ListTodo}
            tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
            href={
              session?.user?.id
                ? `/spots?assigned_to_uid=${session.user.id}`
                : undefined
            }
          />
          <StatCard
            label="Completed"
            value={stats.my_completed}
            icon={CheckCircle2}
            tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            hint={myCompletionRate}
          />
          <StatCard
            label="Pending Review (Mine)"
            value={myPending}
            icon={ClipboardCheck}
            tint="bg-orange-500/10 text-orange-600 dark:text-orange-400"
            href={
              session?.user?.id
                ? `/spots?pipeline_status=ENRICHED&assigned_to_uid=${session.user.id}`
                : undefined
            }
          />
        </div>
        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-500">완료율</span>
            <span className="tabular-nums text-zinc-500">
              {stats.my_completed.toLocaleString("ko-KR")} / {stats.my_assigned_total.toLocaleString("ko-KR")}
              {myCompletionRate && ` (${myCompletionRate})`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${stats.my_assigned_total > 0 ? (stats.my_completed / stats.my_assigned_total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* 분포 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Breakdown
          title="By Source"
          items={stats.by_source}
          barClass="bg-violet-500"
          hrefFor={(k) => `/spots?source=${encodeURIComponent(k)}`}
        />
        <Breakdown
          title="By Region"
          items={stats.by_region_province}
          barClass="bg-blue-500"
          hrefFor={(k) => `/spots?region_province=${encodeURIComponent(k)}`}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  hint,
  href,
}: {
  label: string;
  value: number;
  icon: typeof MapPin;
  tint: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", tint)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tabular-nums">
          {value.toLocaleString("ko-KR")}
          {hint && <span className="ml-2 text-sm font-normal text-zinc-400">{hint}</span>}
        </p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}

function Breakdown({
  title,
  items,
  barClass,
  hrefFor,
}: {
  title: string;
  items: CountItem[];
  barClass: string;
  hrefFor: (key: string) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-xl border p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-500">{title}</h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.key}>
            <Link href={hrefFor(item.key)} className="group block">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="truncate group-hover:underline">{item.key}</span>
                <span className="tabular-nums text-zinc-500">
                  {item.count.toLocaleString("ko-KR")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={cn("h-full rounded-full transition-all", barClass)}
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="py-6 text-center text-sm text-zinc-400">데이터 없음</li>
        )}
      </ul>
    </div>
  );
}
