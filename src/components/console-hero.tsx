"use client";

import Link from "next/link";
import { DotLinkAdapter } from "dotterel-ui/button";
import { useEffect, useState } from "react";
import { useClimb, type Climb } from "@/features/achievements/use-climb";
import { nextTitle, titleFor, titleProgress } from "@/features/rank/titles";

/**
 * ホームの一画面目。右に「SQL を書くと結果が出て正解する」実演を置き、
 * 左に見出し・続きボタン・現在地をまとめる。
 */
export function ConsoleHero() {
  const climb = useClimb();
  return (
    <section className="console-hero" aria-labelledby="console-hero-title">
      <div className="console-hero__text">
        <h1 id="console-hero-title" className="console-hero__title">
          書いて、実行して、
          <br />
          山頂へ。
        </h1>
        <p className="console-hero__lead">
          ブラウザの中の SQLite / PostgreSQL で SQL
          を実行し、答え合わせをする問題集です。インストールも登録もいりません。
        </p>
        <ContinueButton climb={climb} />
        <StatusLine climb={climb} />
      </div>
      <ConsoleDemo />
    </section>
  );
}

function ContinueButton({ climb }: { climb: Climb }) {
  const started = Object.keys(climb.progress.history).length > 0;
  const href = climb.next ? `/problem/${climb.next.id}` : "/mypage";
  const label = !climb.next ? "登山手帳を見る" : started ? "続きから登る" : "最初の問題を解く";
  return (
    <DotLinkAdapter variant="primary" className="console-hero__cta">
      <Link href={href}>{label}</Link>
    </DotLinkAdapter>
  );
}

/** 今の称号・標高・次の称号までのバーと、次の問題 */
function StatusLine({ climb }: { climb: Climb }) {
  const { rank } = climb.progress;
  const next = nextTitle(rank);
  const progress = titleProgress(rank);
  return (
    <div className="hero-status">
      <p className="hero-status__main">
        <span className="hero-status__title">{titleFor(rank).name}</span>
        <span className="hero-status__rank num">{rank.toLocaleString("ja-JP")}m</span>
      </p>
      <span
        className="meter meter--thin"
        role="progressbar"
        aria-label={next ? `次の称号「${next.title.name}」までの進み具合` : "称号の進み具合"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span className="meter__fill" style={{ inlineSize: `${progress * 100}%` }} />
      </span>
      <p className="hero-status__sub">
        {next
          ? `次の「${next.title.name}」まであと ${next.remaining.toLocaleString("ja-JP")}m`
          : "世界の頂に立ちました"}
      </p>
      {climb.ready && climb.next && (
        <p className="hero-status__sub">
          次の問題: {climb.next.altitude.toLocaleString("ja-JP")}m「{climb.next.title}」
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * 実演（飾り。実際のエンジンは動かさない）
 * ------------------------------------------------------------------ */
const DEMO_FILE = "mountains.sql";
const DEMO_SQL =
  "SELECT name, altitude\nFROM mountains\nWHERE altitude >= 3000\nORDER BY altitude DESC;";
const DEMO_COLUMNS = ["name", "altitude"] as const;
const DEMO_ROWS: [string, number][] = [
  ["富士山", 3776],
  ["北岳", 3193],
  ["奥穂高岳", 3190],
];
const KEYWORDS = /\b(SELECT|FROM|WHERE|ORDER BY|DESC)\b/g;
/** 1 文字を打つ間隔 */
const TYPE_MS = 38;

/** text を 1 文字ずつ出す。動きを減らす設定なら最初の 1 回で全文を出す */
function useTyped(text: string): string {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? text.length : 1;
    const timer = setInterval(() => {
      setCount((n) => {
        if (n >= text.length) {
          clearInterval(timer);
          return n;
        }
        return Math.min(text.length, n + step);
      });
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [text]);
  return text.slice(0, count);
}

function Highlighted({ sql }: { sql: string }) {
  return (
    <>
      {sql.split(KEYWORDS).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="console-demo__kw">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function ConsoleDemo() {
  const typed = useTyped(DEMO_SQL);
  const done = typed.length === DEMO_SQL.length;
  return (
    <figure
      className="console-demo"
      aria-label={`SQL を実行した例: ${DEMO_SQL.replace(/\n/g, " ")}`}
    >
      <div className="console-demo__bar" aria-hidden>
        <span>{DEMO_FILE}</span>
        <span className="console-demo__state" data-done={done || undefined}>
          {done ? "実行済み" : "入力中"}
        </span>
      </div>
      <pre className="console-demo__code" aria-hidden>
        <code>
          <Highlighted sql={typed} />
          <span className="console-demo__caret" />
        </code>
      </pre>
      <div className="console-demo__result" data-done={done || undefined}>
        <table>
          <thead>
            <tr>
              {DEMO_COLUMNS.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEMO_ROWS.map(([name, altitude]) => (
              <tr key={name}>
                <td>{name}</td>
                <td className="num">{altitude}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="console-demo__judge">正解しました（{DEMO_ROWS.length} 行）</p>
      </div>
    </figure>
  );
}
