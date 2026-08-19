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
        // 행 안의 링크(제목/화살표)나 체크박스 클릭이면 행 이동을 하지 않는다
        // (base-ui Checkbox는 실제로 role=checkbox인 span을 클릭시킨다, input은 숨겨져 있어 직접 안 맞음)
        if ((e.target as HTMLElement).closest('a, input, label, [role="checkbox"]')) return;
        router.push(href);
      }}
      className="cursor-pointer"
    >
      {children}
    </TableRow>
  );
}
