import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-zinc-400">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}
