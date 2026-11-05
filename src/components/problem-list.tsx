"use client";

import Link from "next/link";
import { Fragment } from "react";
import { useClimb } from "@/features/achievements/use-climb";
import type { Grade } from "@/features/problem/grades";
import { useProblems } from "@/features/problem/api";
import { isSolved, type ProblemStatus } from "@/features/storage/progress-schema";
import { LoadState } from "./load-state";

const STATUS_LABEL: Record<ProblemStatus | "none", string> = {
  none: "未挑戦",
  attempted: "挑戦中",
  solved: "登頂",
  surrendered: "降参",
  solved_after_surrender: "登頂（降参後）",
};

/** 問題を標高順の登山道として並べる。次に登る問題に「現在地」を付ける */
export function ProblemList({ grade }: { grade: Grade }) {
  const problems = useProblems();
  const climb = useClimb();

  return (
    <LoadState value={problems}>
      {(all) => {
        const list = all.filter((p) => p.grade === grade);
        if (list.length === 0) return <p className="muted">この山の問題は準備中です。</p>;
        const solved = list.filter((p) => isSolved(climb.progress.history[p.id])).length;
        const currentId = climb.ready
          ? list.find((p) => !isSolved(climb.progress.history[p.id]))?.id
          : undefined;

        return (
          <>
            <div className="route-summary">
              <p className="route-summary__count">
                登頂 <span className="num">{solved}</span> /{" "}
                <span className="num">{list.length}</span>
              </p>
              <span
                className="meter"
                role="progressbar"
                aria-label="この山の登頂数"
                aria-valuemin={0}
                aria-valuemax={list.length}
                aria-valuenow={solved}
              >
                <span
                  className="meter__fill"
                  style={{ inlineSize: `${(solved / list.length) * 100}%` }}
                />
              </span>
              {solved === list.length && <p className="route-summary__cleared">踏破しました</p>}
            </div>

            <ol className="problem-list route">
              {list.map((p, i) => {
                const entry = climb.progress.history[p.id];
                const status: ProblemStatus | "none" =
                  entry && (entry.status !== "attempted" || entry.attempts > 0 || entry.lastQuery)
                    ? entry.status
                    : "none";
                const current = p.id === currentId;
                const datasetChanged = i === 0 || list[i - 1]!.datasetId !== p.datasetId;
                return (
                  <Fragment key={p.id}>
                    {datasetChanged && (
                      <li className="problem-list__divider route__camp" aria-hidden>
                        {p.datasetName}
                      </li>
                    )}
                    <li
                      className="route__stop"
                      data-status={status}
                      data-current={current || undefined}
                    >
                      <span className="route__node" aria-hidden />
                      <Link
                        href={`/problem/${p.id}`}
                        className="problem-row"
                        data-status={status}
                        data-current={current || undefined}
                      >
                        <span className="problem-row__alt num">
                          {p.altitude.toLocaleString("ja-JP")}m
                        </span>
                        <span className="problem-row__title">{p.title}</span>
                        <span className="problem-row__status">
                          {current ? "現在地 · 挑戦する →" : STATUS_LABEL[status]}
                        </span>
                      </Link>
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </>
        );
      }}
    </LoadState>
  );
}
