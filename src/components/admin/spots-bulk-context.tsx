"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PIPELINE_STATUSES, type SpotListItem } from "@/lib/types";
import { queueBulkStatus, getBulkStatusJob } from "@/lib/actions/spot-status";

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_MS = 5 * 60 * 1000;

type BulkState =
  | { phase: "idle" }
  | { phase: "queuing" }
  | { phase: "polling"; jobId: string; startedAt: number }
  | { phase: "done"; succeeded: string[]; failed: { uid: string; reason: string }[] }
  | { phase: "error"; message: string };

type SpotsBulkContextValue = {
  spots: SpotListItem[];
  selected: Set<string>;
  toggle: (uid: string) => void;
  toggleAll: () => void;
  target: string;
  setTarget: (status: string) => void;
  bulk: BulkState;
  handleBulkChange: () => void;
};

const SpotsBulkContext = createContext<SpotsBulkContextValue | null>(null);

/** 목록 화면의 spot 선택 상태 + 일괄 상태변경 job 폴링을 소유한다.
 * 선택 UI(SpotsBulkIndicator)와 테이블(SpotsTable)이 서로 다른 위치에 렌더되지만
 * 같은 상태를 공유해야 해서 Context로 끌어올렸다. */
export function SpotsBulkProvider({
  spots,
  children,
}: {
  spots: SpotListItem[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<string>(PIPELINE_STATUSES[0]);
  const [bulk, setBulk] = useState<BulkState>({ phase: "idle" });

  // 페이지/정렬/필터가 바뀌어 spots가 교체되면, 더 이상 화면에 없는 uid는 선택에서 제거한다.
  // effect가 아니라 렌더 중 조정하는 이유: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevSpots, setPrevSpots] = useState(spots);
  if (spots !== prevSpots) {
    setPrevSpots(spots);
    setSelected((prev) => {
      const visible = new Set(spots.map((s) => s.uid));
      const next = new Set([...prev].filter((uid) => visible.has(uid)));
      return next.size === prev.size ? prev : next;
    });
  }

  useEffect(() => {
    if (bulk.phase !== "polling") return;
    const { jobId, startedAt } = bulk;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const deadline = setTimeout(() => {
      cancelled = true;
      setBulk({ phase: "error", message: "상태 변경이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요." });
    }, Math.max(0, TIMEOUT_MS - (Date.now() - startedAt)));

    async function poll() {
      const { data: job, error } = await getBulkStatusJob(jobId);
      if (cancelled) return;

      if (error || !job) {
        setBulk({ phase: "error", message: error ?? "작업 상태 조회 실패" });
        return;
      }

      if (job.status === "failed") {
        setBulk({ phase: "error", message: (job.error ?? "상태 변경 실패").split("\n")[0] });
        return;
      }

      if (job.status === "succeeded") {
        const succeeded = job.result?.succeeded ?? [];
        const failed = job.result?.failed ?? [];
        setSelected((prev) => {
          const next = new Set(prev);
          for (const uid of succeeded) next.delete(uid);
          return next;
        });
        setBulk({ phase: "done", succeeded, failed });
        router.refresh();
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    timer = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(deadline);
    };
  }, [bulk, router]);

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === spots.length ? new Set() : new Set(spots.map((s) => s.uid))
    );
  }

  async function handleBulkChange() {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개 spot의 상태를 "${target}"(으)로 변경하시겠습니까?`)) return;
    setBulk({ phase: "queuing" });
    const { data, error } = await queueBulkStatus(Array.from(selected), target);
    if (error || !data) {
      setBulk({ phase: "error", message: error ?? "요청 실패" });
      return;
    }
    setBulk({ phase: "polling", jobId: data.job_id, startedAt: Date.now() });
  }

  return (
    <SpotsBulkContext.Provider
      value={{ spots, selected, toggle, toggleAll, target, setTarget, bulk, handleBulkChange }}
    >
      {children}
    </SpotsBulkContext.Provider>
  );
}

export function useSpotsBulk() {
  const ctx = useContext(SpotsBulkContext);
  if (!ctx) throw new Error("useSpotsBulk must be used within SpotsBulkProvider");
  return ctx;
}
