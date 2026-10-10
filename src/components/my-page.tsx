"use client";

import Link from "next/link";
import { DotButton } from "dotterel-ui/button";
import { DotProgress } from "dotterel-ui/progress";
import { useRef, useState } from "react";
import { GRADES, GRADE_INFO } from "@/features/problem/grades";
import { useProblems } from "@/features/problem/api";
import type { ProblemSummary } from "@/features/problem/schema";
import { nextTitle, titleFor, TITLES } from "@/features/rank/titles";
import { isSolved, type Progress, type ProblemStatus } from "@/features/storage/progress-schema";
import {
  parseImport,
  progressActions,
  useHydrated,
  useProgress,
} from "@/features/storage/progress-store";
import { DialectSwitch } from "./site-header";

const STATUS_LABEL: Record<ProblemStatus, string> = {
  attempted: "挑戦中",
  solved: "登頂",
  surrendered: "降参",
  solved_after_surrender: "登頂（降参後）",
};

export function MyPage() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const problems = useProblems();

  if (!hydrated) return <p className="muted">記録を読み込んでいます…</p>;
  const list = problems.state === "ready" ? problems.data : [];

  return (
    <>
      <RankPanel rank={progress.rank} />
      <GradeProgress progress={progress} problems={list} />
      <History progress={progress} problems={list} />
      <DataTools progress={progress} />
      <Settings progress={progress} />
    </>
  );
}

function RankPanel({ rank }: { rank: number }) {
  const title = titleFor(rank);
  const next = nextTitle(rank);
  const currentMin = title.minRank;
  return (
    <section className="panel rank-panel" aria-labelledby="rank-title">
      <h2 id="rank-title" className="rank-panel__label">
        登山家ランク
      </h2>
      <p className="rank-panel__value dot-num">{rank.toLocaleString("ja-JP")} M</p>
      <p className="rank-panel__title">
        {title.name} <span className="muted">{title.note}</span>
      </p>
      {next ? (
        <div className="rank-panel__next">
          <DotProgress
            value={rank - currentMin}
            max={next.title.minRank - currentMin}
            count={24}
            label={`次の称号「${next.title.name}」までの進み具合`}
            shape="square"
          />
          <p className="muted">
            次の「{next.title.name}」まで あと{" "}
            <span className="num">{next.remaining.toLocaleString("ja-JP")}</span> m
          </p>
        </div>
      ) : (
        <p className="muted">世界の頂に立ちました。</p>
      )}
      <details className="rank-panel__rules">
        <summary>ランクの上がり方</summary>
        <ul>
          <li>自分のランクより高い問題に初めて正解すると、その標高までランクが上がります。</li>
          <li>ランクより低い問題に初めて正解すると、標高の差が大きいほど少しだけ上がります。</li>
          <li>同じ問題に何度正解しても、上がるのは最初の1回だけです。</li>
          <li>
            降参した問題にあとで正解すると、上がり幅は半分になります。ヒントを見ても減りません。
          </li>
        </ul>
        <p className="muted">称号: {TITLES.map((t) => `${t.name}（${t.minRank}m）`).join(" / ")}</p>
      </details>
    </section>
  );
}

function GradeProgress({ progress, problems }: { progress: Progress; problems: ProblemSummary[] }) {
  return (
    <section className="section" aria-labelledby="grade-progress-title">
      <h2 id="grade-progress-title" className="section-title">
        山ごとの登頂数
      </h2>
      <ul className="grade-progress">
        {GRADES.map((grade) => {
          const inGrade = problems.filter((p) => p.grade === grade);
          const solved = inGrade.filter((p) => isSolved(progress.history[p.id])).length;
          return (
            <li key={grade} className="grade-progress__row">
              <Link href={`/problems/${grade}`}>{GRADE_INFO[grade].label}</Link>
              <DotProgress
                value={solved}
                max={Math.max(1, inGrade.length)}
                count={inGrade.length || 10}
                label={`${GRADE_INFO[grade].label}の登頂数`}
                shape="square"
              />
              <span className="num">
                {solved}/{inGrade.length}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function History({ progress, problems }: { progress: Progress; problems: ProblemSummary[] }) {
  const rows = problems
    .map((p) => ({ problem: p, entry: progress.history[p.id] }))
    .filter((r) => r.entry && (r.entry.status !== "attempted" || r.entry.attempts > 0))
    .sort(
      (a, b) =>
        (b.entry!.solvedAt ?? "").localeCompare(a.entry!.solvedAt ?? "") ||
        a.problem.altitude - b.problem.altitude,
    );

  return (
    <section className="section" aria-labelledby="history-title">
      <h2 id="history-title" className="section-title">
        山行の記録
      </h2>
      {rows.length === 0 ? (
        <p className="muted">
          まだ記録がありません。<Link href="/problems/500">〜500m級</Link>から登りはじめましょう。
        </p>
      ) : (
        <div className="history-wrap">
          <table className="history">
            <thead>
              <tr>
                <th scope="col">問題</th>
                <th scope="col">標高</th>
                <th scope="col">状態</th>
                <th scope="col">提出</th>
                <th scope="col">初登頂</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ problem, entry }) => (
                <tr key={problem.id}>
                  <td>
                    <Link href={`/problem/${problem.id}`}>{problem.title}</Link>
                  </td>
                  <td className="num">{problem.altitude}m</td>
                  <td data-status={entry!.status}>{STATUS_LABEL[entry!.status]}</td>
                  <td>{entry!.attempts} 回</td>
                  <td>
                    {entry!.solvedAt ? new Date(entry!.solvedAt).toLocaleDateString("ja-JP") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DataTools({ progress }: { progress: Progress }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState<Progress | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const exportData = () => {
    const blob = new Blob([progressActions.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    a.href = url;
    a.download = `sql-climber-export-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: "ok", text: "学習記録を書き出しました。" });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const check = parseImport(await file.text());
    if (fileRef.current) fileRef.current.value = "";
    if (!check.ok) {
      setMessage({ tone: "error", text: check.message });
      return;
    }
    setMessage(null);
    setPending(check.progress);
  };

  const count = (p: Progress) =>
    Object.values(p.history).filter((e) => e.status !== "attempted" || e.attempts > 0).length;

  return (
    <section className="section" aria-labelledby="data-title">
      <h2 id="data-title" className="section-title">
        記録の書き出しと読み込み
      </h2>
      <p className="muted">
        記録はこのブラウザにだけあります。ブラウザのデータを消すと記録も消えるので、ときどき書き出しておくと安心です。別の端末へ移すときにも使えます。
      </p>
      <div className="data-tools">
        <DotButton onClick={exportData}>書き出す（JSON）</DotButton>
        <DotButton onClick={() => fileRef.current?.click()}>読み込む</DotButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
          aria-label="学習記録ファイル"
        />
      </div>

      {pending && (
        <div className="confirm-box" role="alertdialog" aria-labelledby="import-title">
          <p id="import-title" className="confirm-box__title">
            今の記録を、読み込んだ記録で置き換えますか
          </p>
          <dl className="compare">
            <dt>登山家ランク</dt>
            <dd data-worse={pending.rank < progress.rank || undefined}>
              {progress.rank}m → {pending.rank}m
            </dd>
            <dt>記録のある問題</dt>
            <dd data-worse={count(pending) < count(progress) || undefined}>
              {count(progress)}問 → {count(pending)}問
            </dd>
          </dl>
          <p className="muted">置き換えると、今の記録は元に戻せません（統合はしません）。</p>
          <div className="data-tools">
            <DotButton
              variant="primary"
              onClick={() => {
                progressActions.replace(pending);
                setPending(null);
                setMessage({ tone: "ok", text: "学習記録を読み込みました。" });
              }}
            >
              置き換える
            </DotButton>
            <DotButton onClick={() => setPending(null)}>やめる</DotButton>
          </div>
        </div>
      )}

      {message && (
        <p className={`notice notice--${message.tone}`} role="status">
          {message.text}
        </p>
      )}

      <div className="danger-zone">
        {confirmClear ? (
          <div className="confirm-box" role="alertdialog" aria-labelledby="clear-title">
            <p id="clear-title" className="confirm-box__title">
              すべての記録を消しますか
            </p>
            <p className="muted">
              書き出していない記録は元に戻せません。先に書き出しておくことをおすすめします。
            </p>
            <div className="data-tools">
              <DotButton
                variant="danger"
                onClick={() => {
                  progressActions.clear();
                  setConfirmClear(false);
                  setMessage({ tone: "ok", text: "記録を消しました。" });
                }}
              >
                消す
              </DotButton>
              <DotButton onClick={() => setConfirmClear(false)}>やめる</DotButton>
            </div>
          </div>
        ) : (
          <DotButton variant="quiet" onClick={() => setConfirmClear(true)}>
            記録をすべて消す
          </DotButton>
        )}
      </div>
    </section>
  );
}

function Settings({ progress }: { progress: Progress }) {
  return (
    <section className="section" aria-labelledby="settings-title">
      <h2 id="settings-title" className="section-title">
        設定
      </h2>
      <dl className="settings">
        <dt>SQL の種類</dt>
        <dd>
          <DialectSwitch value={progress.dialect} />
          <p className="muted">
            問題は共通です。切り替えると、選んだ種類のデータベースで実行と判定を行います。PostgreSQL
            は初回の読み込みに少し時間がかかります。
          </p>
        </dd>
        <dt>表示テーマ</dt>
        <dd>
          <div className="segmented" role="radiogroup" aria-label="表示テーマ">
            {(
              [
                ["system", "端末に合わせる"],
                ["light", "昼（明るい）"],
                ["dark", "夜（暗い）"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={progress.theme === value}
                className="segmented__item"
                onClick={() => progressActions.setTheme(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </dd>
      </dl>
    </section>
  );
}
