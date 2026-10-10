"use client";

import Link from "next/link";
import { DotButton, DotLinkAdapter } from "dotterel-ui/button";
import { DotCount } from "dotterel-ui/count";
import { useEffect, useRef, useState } from "react";
import { MountainArt } from "@/components/dot-art";
import { GRADES } from "@/features/problem/grades";
import type { ProblemAnswer, ProblemDetail } from "@/features/problem/schema";
import { nextTitle, titleFor } from "@/features/rank/titles";
import type { AscentResult } from "@/features/storage/progress-logic";

export type Overlay =
  | { kind: "correct"; ascent: AscentResult; answer: ProblemAnswer; surrenderedBefore: boolean }
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
    if (dialog && !dialog.open) dialog.showModal();
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
      <MountainArt level={level} flag className="overlay__art" />
      <p className="overlay__eyebrow">正解</p>
      <h2 id="overlay-title" className="overlay__title">
        {ascent.firstAscent ? "登頂しました" : "正解です"}
      </h2>

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
            <span className="dot-num">+{gain.toLocaleString("ja-JP")} M</span>
            {overlay.surrenderedBefore && <span className="muted">（降参後のため半分）</span>}
            {gain > 0 && gain < problem.altitude * 0.5 && !overlay.surrenderedBefore && (
              <span className="muted">（すでに越えた高さの山なので、少しだけ上がります）</span>
            )}
          </p>
        ) : (
          <p className="ascent__gain muted">この問題は登頂済みです。ランクは変わりません。</p>
        )}
        {after.name !== before.name && (counted || !ascent.firstAscent) && (
          <p className="ascent__title" role="status">
            称号「{after.name}」を得ました <span className="muted">{after.note}</span>
          </p>
        )}
        {next && (
          <p className="ascent__next muted">
            次の「{next.title.name}」まで あと{" "}
            <span className="num">{next.remaining.toLocaleString("ja-JP")}</span> m
          </p>
        )}
      </div>

      <Explanation answer={overlay.answer} />

      <div className="overlay__actions">
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
