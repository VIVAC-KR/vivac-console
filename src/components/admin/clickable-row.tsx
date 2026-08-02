"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

export function ClickableRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <TableRow
      onClick={(e) => {
        // 행 안의 링크(제목/화살표)는 다른 곳으로 가므로, 링크 클릭이면 행 이동을 하지 않는다
        if ((e.target as HTMLElement).closest("a")) return;
        router.push(href);
      }}
      className="cursor-pointer"
    >
      {children}
    </TableRow>
  );
}
