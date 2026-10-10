/** 既到達標高より低い問題を解いたときの加算係数（ADR-0006） */
export const RANK_GAIN_RATE = 0.1;

/**
 * 登山家ランクの更新（docs/design/04-judge-rank.md）。初回正解時にだけ呼ぶ。
 * - h >= R: その標高までジャンプ
 * - h <  R: 差が開くほど小さい微加算
 * - 降参済みの問題は増分を半減
 */
export function nextRank(rank: number, altitude: number, surrendered: boolean): number {
  const gain =
    altitude >= rank ? altitude - rank : Math.round(RANK_GAIN_RATE * altitude * (altitude / rank));
  const applied = surrendered ? Math.round(gain / 2) : gain;
  return rank + applied;
}
