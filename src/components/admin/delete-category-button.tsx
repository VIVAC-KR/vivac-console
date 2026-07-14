"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteCategoryButton({
  code,
  action,
}: {
  code: string;
  action: (code: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            `"${code}" 카테고리를 삭제하시겠습니까?\n모든 스팟의 카테고리에서도 함께 제거됩니다.`
          )
        ) {
          return;
        }
        startTransition(() => action(code));
      }}
    >
      삭제
    </Button>
  );
}
