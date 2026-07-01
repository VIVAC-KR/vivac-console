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
      <p className="max-w-md text-sm text-zinc-500 break-all">{error.message}</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
