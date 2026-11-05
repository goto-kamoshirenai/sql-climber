"use client";

import Link from "next/link";
import { DotLinkAdapter } from "dotterel-ui/button";
import { ACHIEVEMENTS } from "@/features/achievements/achievements";
import type { Climb } from "@/features/achievements/use-climb";
import { nextTitle, titleFor, titleProgress } from "@/features/rank/titles";

/** 登山家ランク・次の称号までの進み具合・山行の集計をまとめたカード */
export function PlayerCard({
  climb,
  headingLevel = 2,
  showContinue = true,
}: {
  climb: Climb;
  headingLevel?: 1 | 2;
  showContinue?: boolean;
}) {
  const { rank } = climb.progress;
  const title = titleFor(rank);
  const next = nextTitle(rank);
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className="player-card" aria-labelledby="player-card-title">
      <div className="player-card__head">
        <div>
          <p className="player-card__eyebrow">登山家ランク</p>
          <Heading id="player-card-title" className="player-card__title">
            {title.name}
          </Heading>
          <p className="player-card__note">{title.note}</p>
        </div>
        <p className="player-card__rank">
          <span className="player-card__value">{rank.toLocaleString("ja-JP")}</span>
          <span className="player-card__unit">m</span>
        </p>
      </div>

      <div className="player-card__meter">
        <span
          className="meter"
          role="progressbar"
          aria-label={next ? `次の称号「${next.title.name}」までの進み具合` : "称号の進み具合"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(titleProgress(rank) * 100)}
        >
          <span className="meter__fill" style={{ inlineSize: `${titleProgress(rank) * 100}%` }} />
        </span>
        <p className="player-card__next">
          {next ? (
            <>
              次の「{next.title.name}」まで あと{" "}
              <span className="num">{next.remaining.toLocaleString("ja-JP")}</span> m
            </>
          ) : (
            "世界の頂に立ちました"
          )}
        </p>
      </div>

      <dl className="player-stats">
        <div className="player-stats__item">
          <dt>登頂</dt>
          <dd>
            <span className="num">{climb.stats.solved}</span>
            <span className="player-stats__of">/ {climb.stats.total}</span>
          </dd>
        </div>
        <div className="player-stats__item" data-hot={climb.stats.currentStreak >= 2 || undefined}>
          <dt>連続</dt>
          <dd>
            <span className="num">{climb.stats.currentStreak}</span>
            <span className="player-stats__of">日</span>
          </dd>
        </div>
        <div className="player-stats__item">
          <dt>実績</dt>
          <dd>
            <span className="num">{climb.achievements.length}</span>
            <span className="player-stats__of">/ {ACHIEVEMENTS.length}</span>
          </dd>
        </div>
      </dl>

      {showContinue && <ContinueLink climb={climb} />}
    </section>
  );
}

function ContinueLink({ climb }: { climb: Climb }) {
  if (!climb.ready) {
    return <p className="continue continue--placeholder" aria-hidden />;
  }
  if (!climb.next) {
    return (
      <DotLinkAdapter variant="primary" className="continue">
        <Link href="/mypage">
          <span className="continue__label">全山踏破。登山手帳を見る</span>
        </Link>
      </DotLinkAdapter>
    );
  }
  const started = climb.stats.solved > 0 || Object.keys(climb.progress.history).length > 0;
  return (
    <DotLinkAdapter variant="primary" className="continue">
      <Link href={`/problem/${climb.next.id}`}>
        <span className="continue__label">{started ? "続きから登る" : "最初の一歩を踏み出す"}</span>
        <span className="continue__target">
          <span className="num">{climb.next.altitude.toLocaleString("ja-JP")}m</span>{" "}
          {climb.next.title}
        </span>
        <span className="continue__icon" aria-hidden>
          →
        </span>
      </Link>
    </DotLinkAdapter>
  );
}
