import Link from "next/link";
import { apiFetch } from "@/lib/api";

type CountItem = { key: string; count: number };
type SpotStats = {
  total: number;
  business_info_total: number;
  missing_coordinates: number;
  by_source: CountItem[];
  by_region_province: CountItem[];
};

export default async function DashboardPage() {
  const stats = await apiFetch<SpotStats>("/internal/spots/stats");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="총 스팟" value={stats.total} />
        <StatCard label="사업정보" value={stats.business_info_total} />
        <StatCard
          label="좌표 누락"
          value={stats.missing_coordinates}
          hint={
            stats.total > 0
              ? `${((stats.missing_coordinates / stats.total) * 100).toFixed(1)}%`
              : undefined
          }
        />
      </div>

      {/* 분포 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Breakdown
          title="소스별"
          items={stats.by_source}
          hrefFor={(k) => `/spots?source=${encodeURIComponent(k)}`}
        />
        <Breakdown
          title="도/광역시별"
          items={stats.by_region_province}
          hrefFor={(k) => `/spots?region_province=${encodeURIComponent(k)}`}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value.toLocaleString("ko-KR")}
        {hint && <span className="ml-2 text-sm font-normal text-zinc-400">{hint}</span>}
      </p>
    </div>
  );
}

function Breakdown({
  title,
  items,
  hrefFor,
}: {
  title: string;
  items: CountItem[];
  hrefFor: (key: string) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-500">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link href={hrefFor(item.key)} className="group block">
              <div className="mb-0.5 flex items-center justify-between text-sm">
                <span className="truncate group-hover:underline">{item.key}</span>
                <span className="tabular-nums text-zinc-500">
                  {item.count.toLocaleString("ko-KR")}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-zinc-400 dark:bg-zinc-500"
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
