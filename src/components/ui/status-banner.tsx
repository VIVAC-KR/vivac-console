/** 저장 성공/실패 배너. 둘 다 있으면 에러를 보여준다. */
export function StatusBanner({
  saved,
  error,
}: {
  saved?: string | null;
  error?: string | null;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive break-all"
      >
        {error}
      </div>
    );
  }
  if (saved) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
        저장되었습니다.
      </div>
    );
  }
  return null;
}
