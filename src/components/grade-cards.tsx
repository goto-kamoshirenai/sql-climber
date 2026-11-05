"use client";

import Link from "next/link";
import { useClimb } from "@/features/achievements/use-climb";
import { GRADES, GRADE_INFO } from "@/features/problem/grades";
import { isSolved } from "@/features/storage/progress-schema";
import { MountainArt } from "./dot-art";

export function GradeCards() {
  const climb = useClimb();

  return (
    <ol className="grade-cards">
      {GRADES.map((grade, index) => {
        const info = GRADE_INFO[grade];
        const inGrade = climb.problems.filter((p) => p.grade === grade);
        const solved = inGrade.filter((p) => isSolved(climb.progress.history[p.id])).length;
        const total = inGrade.length;
        const cleared = total > 0 && solved === total;
        const current = climb.ready && climb.next?.grade === grade;
        const ratio = total > 0 ? solved / total : 0;

        return (
          <li key={grade}>
            <Link
              href={`/problems/${grade}`}
              className="grade-card"
              data-cleared={cleared || undefined}
              data-current={current || undefined}
              data-reached={climb.progress.rank >= grade || undefined}
            >
              <div className="grade-card__art-wrap">
                <MountainArt
                  level={index as 0 | 1 | 2 | 3}
                  flag={cleared}
                  className="grade-card__art"
                />
                {current && <span className="grade-card__badge">現在地</span>}
                {cleared && (
                  <span className="grade-card__badge grade-card__badge--cleared">踏破</span>
                )}
              </div>
              <div className="grade-card__body">
                <p className="grade-card__alt num">{grade.toLocaleString("ja-JP")}m</p>
                <h3 className="grade-card__label">{info.label}</h3>
                <p className="grade-card__summary">{info.summary}</p>
                <div className="grade-card__progress">
                  <span className="meter meter--thin" aria-hidden>
                    <span className="meter__fill" style={{ inlineSize: `${ratio * 100}%` }} />
                  </span>
                  <p className="grade-card__count">
                    {climb.problems.length > 0 ? (
                      <>
                        登頂 <span className="num">{solved}</span> /{" "}
                        <span className="num">{total}</span> 問
                      </>
                    ) : (
                      <span className="muted">問題数を確認中…</span>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
