"use client";

import Link from "next/link";
import { Fragment } from "react";
import type { Grade } from "@/features/problem/grades";
import { useProblems } from "@/features/problem/api";
import type { ProblemStatus } from "@/features/storage/progress-schema";
import { useHydrated, useProgress } from "@/features/storage/progress-store";
import { LoadState } from "./load-state";

const STATUS_LABEL: Record<ProblemStatus | "none", string> = {
  none: "未挑戦",
  attempted: "挑戦中",
  solved: "登頂",
  surrendered: "降参",
  solved_after_surrender: "登頂（降参後）",
};

export function ProblemList({ grade }: { grade: Grade }) {
  const problems = useProblems();
  const progress = useProgress();
  const hydrated = useHydrated();

  return (
    <LoadState value={problems}>
      {(all) => {
        const list = all.filter((p) => p.grade === grade);
        if (list.length === 0) return <p className="muted">この山の問題は準備中です。</p>;
        return (
          <ol className="problem-list">
            {list.map((p, i) => {
              const entry = hydrated ? progress.history[p.id] : undefined;
              const status: ProblemStatus | "none" =
                entry && (entry.status !== "attempted" || entry.attempts > 0 || entry.lastQuery)
                  ? entry.status
                  : "none";
              const datasetChanged = i === 0 || list[i - 1]!.datasetId !== p.datasetId;
              return (
                <Fragment key={p.id}>
                  {datasetChanged && (
                    <li className="problem-list__divider" aria-hidden>
                      {p.datasetName}
                    </li>
                  )}
                  <li>
                    <Link href={`/problem/${p.id}`} className="problem-row" data-status={status}>
                      <span className="problem-row__alt num">
                        {p.altitude.toLocaleString("ja-JP")}m
                      </span>
                      <span className="problem-row__title">{p.title}</span>
                      <span className="problem-row__status">{STATUS_LABEL[status]}</span>
                    </Link>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        );
      }}
    </LoadState>
  );
}
