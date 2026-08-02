import { Label } from "@/components/ui/label";

/** 라벨 + 입력 한 줄. extra는 라벨 오른쪽 보조 액션(검색 링크 등). */
export function Field({
  label,
  extra,
  children,
}: {
  label: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        {extra}
      </div>
      {children}
    </div>
  );
}
