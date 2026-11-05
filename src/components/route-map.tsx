"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Climb } from "@/features/achievements/use-climb";
import { GRADES, GRADE_INFO } from "@/features/problem/grades";
import { nextTitle } from "@/features/rank/titles";
import { isSolved } from "@/features/storage/progress-schema";

/** 描画領域（viewBox）。横は問題の並び、縦は標高 */
const W = 1000;
const H = 280;
const PAD = { left: 28, right: 28, top: 36, bottom: 40 };
const TOP_ALTITUDE = 4000;

const xAt = (i: number, n: number) =>
  PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD.left - PAD.right));
/** 低い標高の問題が詰まらないよう、平方根で縦に広げる */
const yAt = (altitude: number) =>
  H -
  PAD.bottom -
  Math.sqrt(Math.min(altitude, TOP_ALTITUDE) / TOP_ALTITUDE) * (H - PAD.top - PAD.bottom);

/** 遠景の山並み（飾り）。横位置の割合と標高 */
const FAR_RANGE: [number, number][] = [
  [0, 300],
  [0.12, 900],
  [0.2, 500],
  [0.34, 1900],
  [0.45, 1200],
  [0.58, 2900],
  [0.68, 2000],
  [0.8, 3500],
  [0.88, 2700],
  [1, 3200],
];
const farRangePath =
  FAR_RANGE.map(([f, a], i) => `${i === 0 ? "M" : "L"} ${f * W} ${yAt(a)}`).join(" ") +
  ` L ${W} ${H - PAD.bottom} L 0 ${H - PAD.bottom} Z`;

/** 隣り合う問題のあいだに鞍部（少し低い点）をはさみ、坂ではなく稜線に見せる */
function ridgePath(points: { x: number; y: number; altitude: number }[]): string {
  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1]!;
      const saddle = Math.min(prev.altitude, p.altitude) * (0.9 - (i % 3) * 0.04);
      return `L ${(prev.x + p.x) / 2} ${yAt(saddle)} L ${p.x} ${p.y}`;
    })
    .join(" ");
}

/** 全問題を標高順に並べた登山ルートの全体図 */
export function RouteMap({ climb }: { climb: Climb }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const problems = [...climb.problems].sort((a, b) => a.altitude - b.altitude);
  const n = problems.length;
  const points = problems.map((p, i) => ({
    problem: p,
    x: xAt(i, n),
    y: yAt(p.altitude),
    altitude: p.altitude,
    solved: isSolved(climb.progress.history[p.id]),
  }));
  const currentIndex = climb.ready ? points.findIndex((p) => p.problem.id === climb.next?.id) : -1;
  const climbedUntil = currentIndex === -1 ? (climb.ready ? n - 1 : -1) : currentIndex;
  const ridge = ridgePath(points);
  const climbed = climbedUntil > 0 ? ridgePath(points.slice(0, climbedUntil + 1)) : "";
  const rank = climb.progress.rank;
  const next = nextTitle(rank);
  const current = currentIndex >= 0 ? points[currentIndex] : undefined;

  // 狭い画面では横にスクロールするので、現在地が見える位置まで送る
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !current) return;
    el.scrollLeft = (current.x / W) * el.scrollWidth - el.clientWidth / 2;
  }, [current]);

  if (n === 0) return <div className="route-map route-map--loading" aria-hidden />;

  const gradeStarts = GRADES.map((grade) => ({
    grade,
    index: problems.findIndex((p) => p.grade === grade),
  })).filter((g) => g.index >= 0);

  return (
    <div className="route-map">
      <div className="route-map__scroll" ref={scrollRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="route-map__svg"
          role="group"
          aria-label={`ルート全体図。全 ${n} 問のうち ${climb.stats.solved} 問を登頂`}
        >
          <defs>
            <linearGradient id="route-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" className="route-map__fill-top" />
              <stop offset="1" className="route-map__fill-bottom" />
            </linearGradient>
          </defs>

          {gradeStarts.map(({ grade, index }, i) => {
            const x0 = i === 0 ? 0 : (xAt(index - 1, n) + xAt(index, n)) / 2;
            return (
              <g key={grade}>
                {i > 0 && (
                  <line
                    x1={x0}
                    x2={x0}
                    y1={PAD.top - 12}
                    y2={H - PAD.bottom}
                    className="route-map__band"
                  />
                )}
                <text x={x0 + 10} y={H - 14} className="route-map__band-label">
                  {GRADE_INFO[grade].label}
                </text>
              </g>
            );
          })}

          <path d={farRangePath} className="route-map__far" />
          <path
            d={`${ridge} L ${W - PAD.right} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`}
            fill="url(#route-fill)"
          />
          <path d={ridge} className="route-map__ridge" />
          {climbed && <path d={climbed} className="route-map__climbed" />}

          {climb.ready && rank > 0 && (
            <g className="route-map__level route-map__level--rank">
              <line x1={0} x2={W} y1={yAt(rank)} y2={yAt(rank)} />
              <text x={W - 8} y={yAt(rank) + 15} textAnchor="end">
                あなた {rank.toLocaleString("ja-JP")}m
              </text>
            </g>
          )}
          {climb.ready && next && next.title.minRank <= TOP_ALTITUDE && (
            <g className="route-map__level">
              <line x1={0} x2={W} y1={yAt(next.title.minRank)} y2={yAt(next.title.minRank)} />
              <text x={W - 8} y={yAt(next.title.minRank) - 6} textAnchor="end">
                次の称号「{next.title.name}」{next.title.minRank.toLocaleString("ja-JP")}m
              </text>
            </g>
          )}

          {points.map((p, i) => (
            <Link
              key={p.problem.id}
              href={`/problem/${p.problem.id}`}
              prefetch={false}
              className="route-map__stop"
              data-solved={p.solved || undefined}
              data-current={i === currentIndex || undefined}
              aria-label={`${p.altitude}m ${p.problem.title}${p.solved ? "（登頂）" : ""}`}
            >
              <title>{`${p.altitude}m ${p.problem.title}`}</title>
              <circle cx={p.x} cy={p.y} r={14} className="route-map__hit" />
              <circle cx={p.x} cy={p.y} r={i === currentIndex ? 7 : 5} className="route-map__dot" />
            </Link>
          ))}

          {current && (
            <g className="route-map__you" transform={`translate(${current.x} ${current.y})`}>
              <circle r={7} className="route-map__pulse" />
              <g transform="translate(0 -12)">
                <rect x={-1} y={-26} width={2} height={26} className="route-map__pole" />
                <path d="M 1 -26 L 15 -21 L 1 -16 Z" className="route-map__flag" />
              </g>
              <text y={-44} textAnchor="middle" className="route-map__you-label">
                現在地
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
