"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmActionButton({
  confirmMessage,
  action,
  children = "삭제",
  variant = "ghost",
}: {
  confirmMessage: string;
  action: () => Promise<void>;
  children?: React.ReactNode;
  variant?: "ghost" | "destructive" | "outline";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        startTransition(() => action());
      }}
    >
      {children}
    </Button>
  );
}
