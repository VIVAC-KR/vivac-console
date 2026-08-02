"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-lg font-semibold">문제가 발생했습니다</p>
      {/* error.message에는 upstream 응답 본문이 실려 있어 그대로 노출하지 않는다. */}
      <p className="max-w-md text-sm text-zinc-500">
        일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.
      </p>
      {error.digest && (
        <p className="text-xs text-zinc-400">
          문의 시 이 코드를 알려주세요: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
