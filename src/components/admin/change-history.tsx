import { cn } from "@/lib/utils";
import { labelFor, formatHistoryValue } from "@/lib/field-labels";

type Change = { before: unknown; after: unknown };

export type HistoryEntry = {
  changed_at: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  changed_by: string;
  changed_by_name: string | null;
  changes: Record<string, Change>;
};

const ACTION: Record<string, { label: string; cls: string }> = {
  INSERT: { label: "생성", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  UPDATE: { label: "수정", cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  DELETE: { label: "삭제", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

export function ChangeHistory({ entries }: { entries: HistoryEntry[] | null }) {
  if (entries === null) {
    return <p className="text-sm text-zinc-400">수정 기록을 불러오지 못했습니다.</p>;
  }
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-400">수정 기록이 없습니다.</p>;
  }

  return (
    <details className="rounded-lg border">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
        수정 기록 ({entries.length})
      </summary>
      <ul className="divide-y border-t">
        {entries.map((entry, i) => {
          const action = ACTION[entry.action] ?? {
            label: entry.action,
            cls: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
          };
          const fields = Object.entries(entry.changes);
          return (
            <li key={i} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", action.cls)}>
                  {action.label}
                </span>
                <span className="text-zinc-500">
                  {new Date(entry.changed_at).toLocaleString("ko-KR")}
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>{entry.changed_by_name ?? "시스템"}</span>
              </div>
              {fields.length === 0 ? (
                <p className="text-xs text-zinc-400">변경사항 없음</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {fields.map(([field, change]) => (
                    <li key={field} className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-zinc-500">{labelFor(field)}</span>
                      <span className="text-zinc-400 line-through">
                        {formatHistoryValue(change.before)}
                      </span>
                      <span className="text-zinc-400">→</span>
                      <span className="font-medium">{formatHistoryValue(change.after)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
