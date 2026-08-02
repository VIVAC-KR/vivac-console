import Link from "next/link";

export function Pager({
  page,
  totalPages,
  href,
}: {
  page: number;
  totalPages: number;
  href: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  // 범위 밖 page로 들어와도 "이전"이 마지막 페이지로 향하도록 클램프
  const current = Math.min(page, totalPages);
  const cls = "px-3 py-1 border rounded hover:bg-zinc-50 dark:hover:bg-zinc-900";

  return (
    <div className="flex items-center gap-2 text-sm">
      {current > 1 && (
        <Link href={href(current - 1)} className={cls}>
          이전
        </Link>
      )}
      <span className="text-zinc-500">
        {current} / {totalPages}
      </span>
      {current < totalPages && (
        <Link href={href(current + 1)} className={cls}>
          다음
        </Link>
      )}
    </div>
  );
}
