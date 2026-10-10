"use client";

import Link from "next/link";
import { GRADES, GRADE_INFO } from "@/features/problem/grades";
import { useProblems } from "@/features/problem/api";
import { isSolved } from "@/features/storage/progress-schema";
import { useHydrated, useProgress } from "@/features/storage/progress-store";
import { MountainArt } from "./dot-art";

export function GradeCards() {
  const problems = useProblems();
  const progress = useProgress();
  const hydrated = useHydrated();

  return (
    <ol className="grade-cards">
      {GRADES.map((grade, index) => {
        const info = GRADE_INFO[grade];
        const inGrade =
          problems.state === "ready" ? problems.data.filter((p) => p.grade === grade) : [];
        const solved = hydrated
          ? inGrade.filter((p) => isSolved(progress.history[p.id])).length
          : 0;
        const total = inGrade.length;
        const reached = hydrated && progress.rank >= grade;

        return (
          <li key={grade}>
            <Link
              href={`/problems/${grade}`}
              className="grade-card"
              data-reached={reached || undefined}
            >
              <MountainArt
                level={index as 0 | 1 | 2 | 3}
                flag={reached}
                className="grade-card__art"
              />
              <div className="grade-card__body">
                <h3 className="grade-card__label">
                  <span className="dot-num grade-card__alt">{grade.toLocaleString("ja-JP")}M</span>
                  <span>{info.label}</span>
                </h3>
                <p className="grade-card__summary">{info.summary}</p>
                <p className="grade-card__count">
                  {problems.state === "ready" ? (
                    <>
                      登頂 <span className="num">{solved}</span> /{" "}
                      <span className="num">{total}</span> 問
                    </>
                  ) : (
                    <span className="muted">問題数を確認中…</span>
                  )}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
