"use client";

import Link from "next/link";
import { DotButton, DotLinkAdapter } from "dotterel-ui/button";
import { DotCount } from "dotterel-ui/count";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MountainArt } from "@/components/dot-art";
import { GRADES } from "@/features/problem/grades";
import type { ProblemAnswer, ProblemDetail } from "@/features/problem/schema";
import { nextTitle, titleFor } from "@/features/rank/titles";
import type { Achievement } from "@/features/achievements/achievements";
import type { AscentResult } from "@/features/storage/progress-logic";
import { Icon } from "dotterel-ui/icon";

export type Overlay =
  | {
      kind: "correct";
      ascent: AscentResult;
      answer: ProblemAnswer;
      surrenderedBefore: boolean;
      /** 1回目の提出で登頂した */
      firstTry: boolean;
      /** この登頂で新たに達成した実績 */
      unlocked: Achievement[];
      /** 連続登頂日数（この登頂を含む） */
      streak: number;
    }
  | { kind: "incorrect" }
  | { kind: "confirm-surrender" }
  | { kind: "surrendered"; answer: ProblemAnswer };

export function ResultOverlay({
  overlay,
  problem,
  onClose,
  onRetryKeep,
  onRetryReset,
  onRequestSurrender,
  onConfirmSurrender,
}: {
  overlay: Overlay;
  problem: ProblemDetail;
  onClose: () => void;
  onRetryKeep: () => void;
  onRetryReset: () => void;
  onRequestSurrender: () => void;
  onConfirmSurrender: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    // autoFocus のボタンへスクロールされるので、見出しが見える位置に戻す
    dialog.scrollTop = 0;
  }, []);

  const level = GRADES.indexOf(problem.grade) as 0 | 1 | 2 | 3;
  const gradeHref = `/problems/${problem.grade}`;

  return (
    <dialog
      ref={ref}
      className={`overlay overlay--${overlay.kind}`}
      aria-labelledby="overlay-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {overlay.kind === "correct" && (
        <Correct
          overlay={overlay}
          level={level}
          problem={problem}
          gradeHref={gradeHref}
          onClose={onClose}
        />
      )}

      {overlay.kind === "incorrect" && (
        <div className="overlay__body">
          <MountainArt level={level} className="overlay__art overlay__art--dim" />
          <p className="overlay__eyebrow">判定</p>
          <h2 id="overlay-title" className="overlay__title">
            まだ山頂ではありません
          </h2>
          <p className="overlay__text">
            結果が期待と違うようです。取り出す列とその順番、絞り込みの条件、並び順の指定をもう一度確かめてください。
          </p>
          <div className="overlay__actions">
            <DotButton variant="primary" onClick={onRetryKeep} autoFocus>
              再挑戦（回答を残す）
            </DotButton>
            <DotButton onClick={onRetryReset}>再挑戦（最初から）</DotButton>
            <DotButton variant="quiet" onClick={onRequestSurrender}>
              降参して解説を見る
            </DotButton>
          </div>
          <OverlayNav gradeHref={gradeHref} />
        </div>
      )}

      {overlay.kind === "confirm-surrender" && (
        <div className="overlay__body">
          <p className="overlay__eyebrow">降参</p>
          <h2 id="overlay-title" className="overlay__title">
            降参して解説を見ますか
          </h2>
          <p className="overlay__text">
            降参すると模範解答と解説が見られます。そのあとでこの問題に正解した場合、獲得できる標高は半分になります。
          </p>
          <div className="overlay__actions">
            <DotButton variant="danger" onClick={onConfirmSurrender}>
              降参する
            </DotButton>
            <DotButton onClick={onClose} autoFocus>
              もう少し考える
            </DotButton>
          </div>
        </div>
      )}

      {overlay.kind === "surrendered" && (
        <div className="overlay__body">
          <p className="overlay__eyebrow">降参</p>
          <h2 id="overlay-title" className="overlay__title">
            今回は引き返しましょう
          </h2>
          <p className="overlay__text">
            山は逃げません。解説を読んだら、自分の手でもう一度書いてみてください。
          </p>
          <Explanation answer={overlay.answer} />
          <div className="overlay__actions">
            <DotButton variant="primary" onClick={onRetryKeep} autoFocus>
              エディタに戻る
            </DotButton>
          </div>
          <OverlayNav gradeHref={gradeHref} />
        </div>
      )}
    </dialog>
  );
}

function Correct({
  overlay,
  level,
  problem,
  gradeHref,
  onClose,
}: {
  overlay: Extract<Overlay, { kind: "correct" }>;
  level: 0 | 1 | 2 | 3;
  problem: ProblemDetail;
  gradeHref: string;
  onClose: () => void;
}) {
  const { ascent } = overlay;
  const before = titleFor(ascent.rankBefore);
  const after = titleFor(ascent.rankAfter);
  const next = nextTitle(ascent.rankAfter);
  const [counted, setCounted] = useState(false);
  const gain = ascent.rankAfter - ascent.rankBefore;

  return (
    <div className="overlay__body">
      <div className="celebrate">
        {ascent.firstAscent && <DotBurst />}
        <MountainArt level={level} flag className="overlay__art" />
      </div>
      <p className="overlay__eyebrow">正解</p>
      <h2 id="overlay-title" className="overlay__title">
        {ascent.firstAscent ? "登頂しました" : "正解です"}
      </h2>
      {(overlay.firstTry || (ascent.firstAscent && overlay.streak >= 2)) && (
        <ul className="feats">
          {overlay.firstTry && <li className="feat">一発登頂</li>}
          {ascent.firstAscent && overlay.streak >= 2 && (
            <li className="feat feat--streak">
              <span className="num">{overlay.streak}</span> 日連続
            </li>
          )}
        </ul>
      )}

      <div className="ascent">
        <p className="ascent__label">登山家ランク</p>
        <p className="ascent__rank">
          {ascent.firstAscent ? (
            <DotCount
              from={ascent.rankBefore}
              to={ascent.rankAfter}
              suffix=" M"
              duration={1400}
              delay={300}
              onComplete={() => setCounted(true)}
            />
          ) : (
            <span className="dot-num">{ascent.rankAfter.toLocaleString("ja-JP")} M</span>
          )}
        </p>
        {ascent.firstAscent ? (
          <p className="ascent__gain">
            <span className="ascent__plus">+{gain.toLocaleString("ja-JP")} m</span>
            {overlay.surrenderedBefore && <span className="muted">（降参後のため半分）</span>}
            {gain > 0 && gain < problem.altitude * 0.5 && !overlay.surrenderedBefore && (
              <span className="muted">（すでに越えた高さの山なので、少しだけ上がります）</span>
            )}
          </p>
        ) : (
          <p className="ascent__gain muted">この問題は登頂済みです。ランクは変わりません。</p>
        )}
        {after.name !== before.name && (counted || !ascent.firstAscent) && (
          <div className="title-up" role="status">
            <span className="title-up__icon">
              <Icon name="crown" size="md" />
            </span>
            <span className="title-up__text">
              <span className="title-up__eyebrow">称号アップ</span>
              <span className="title-up__names">
                <span className="title-up__before">{before.name}</span>
                <span aria-hidden>→</span>
                <span className="title-up__after">{after.name}</span>
              </span>
              <span className="title-up__note">{after.note}</span>
            </span>
            <span className="visually-hidden">称号「{after.name}」を得ました</span>
          </div>
        )}
        {next && (
          <p className="ascent__next muted">
            次の「{next.title.name}」まで あと{" "}
            <span className="num">{next.remaining.toLocaleString("ja-JP")}</span> m
          </p>
        )}
      </div>

      {overlay.unlocked.length > 0 && (
        <section className="unlocks" aria-label="達成した実績">
          {overlay.unlocked.map((a, i) => (
            <div key={a.id} className="unlock" style={{ "--i": i } as CSSProperties}>
              <span className="unlock__icon">
                <Icon name={a.icon} size="md" />
              </span>
              <span>
                <span className="unlock__eyebrow">実績を達成</span>
                <span className="unlock__name">{a.name}</span>
                <span className="unlock__desc">{a.description}</span>
              </span>
            </div>
          ))}
        </section>
      )}

      <Explanation answer={overlay.answer} />

      <div className="overlay__actions overlay__actions--sticky">
        {problem.nextId ? (
          <DotLinkAdapter variant="primary">
            <Link href={`/problem/${problem.nextId}`} autoFocus>
              次の問題へ
            </Link>
          </DotLinkAdapter>
        ) : (
          <DotLinkAdapter variant="primary">
            <Link href={nextGradeHref(problem.grade)}>次の山へ</Link>
          </DotLinkAdapter>
        )}
        <DotButton onClick={onClose}>エディタに戻る</DotButton>
      </div>
      <OverlayNav gradeHref={gradeHref} />
    </div>
  );
}

/** 登頂の紙吹雪（ドットが山頂から弾ける） */
const BURST = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.35;
  const distance = 70 + ((i * 37) % 60);
  return {
    x: Math.round(Math.cos(angle) * distance * 1.6),
    y: Math.round(Math.sin(angle) * distance - 30),
    delay: (i % 7) * 40,
    tone: i % 3,
  };
});

function DotBurst() {
  return (
    <span className="burst" aria-hidden>
      {BURST.map((d, i) => (
        <span
          key={i}
          className="burst__dot"
          data-tone={d.tone}
          style={
            {
              "--x": `${d.x}px`,
              "--y": `${d.y}px`,
              "--delay": `${d.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

function nextGradeHref(grade: ProblemDetail["grade"]) {
  const next = GRADES[GRADES.indexOf(grade) + 1];
  return next ? `/problems/${next}` : "/mypage";
}

function Explanation({ answer }: { answer: ProblemAnswer }) {
  return (
    <section className="explanation" aria-label="解説">
      <h3 className="explanation__title">解説</h3>
      <div className="prose" dangerouslySetInnerHTML={{ __html: answer.explanationHtml }} />
    </section>
  );
}

function OverlayNav({ gradeHref }: { gradeHref: string }) {
  return (
    <nav className="overlay__nav" aria-label="移動">
      <Link href={gradeHref}>問題選択に戻る</Link>
      <Link href="/">ホームに戻る</Link>
    </nav>
  );
}
