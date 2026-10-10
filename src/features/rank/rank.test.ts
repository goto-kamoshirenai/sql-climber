import { describe, expect, it } from "vitest";
import { nextRank } from "./rank";
import { nextTitle, titleFor, TITLES } from "./titles";

describe("nextRank", () => {
  it("初登頂はその標高までジャンプする", () => {
    expect(nextRank(0, 450, false)).toBe(450);
    expect(nextRank(450, 1400, false)).toBe(1400);
  });

  it("ランクと同じ標高ならジャンプ量は0", () => {
    expect(nextRank(450, 450, false)).toBe(450);
  });

  it("低い問題は差が開くほど微加算になる", () => {
    expect(nextRank(3000, 500, false)).toBe(3000 + 8);
    expect(nextRank(1400, 1200, false)).toBe(1400 + 103);
    // h が R に近いほど加算が大きい
    const near = nextRank(1000, 999, false) - 1000;
    const far = nextRank(1000, 100, false) - 1000;
    expect(near).toBeGreaterThan(far);
  });

  it("h = R - 1 の境界でも h * 0.1 程度の加算", () => {
    expect(nextRank(1000, 999, false)).toBe(1000 + Math.round(0.1 * 999 * (999 / 1000)));
  });

  it("降参済みの問題はジャンプも微加算も半減", () => {
    expect(nextRank(0, 450, true)).toBe(225);
    expect(nextRank(1400, 1200, true)).toBe(1400 + Math.round(103 / 2));
  });

  it("R = 0 では必ずジャンプ側に入る（ゼロ除算しない）", () => {
    expect(Number.isFinite(nextRank(0, 1, false))).toBe(true);
  });
});

describe("titles", () => {
  it("minRank が昇順に並んでいる", () => {
    const ranks = TITLES.map((t) => t.minRank);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });

  it("ランクに応じた称号を返す", () => {
    expect(titleFor(0).name).toBe("登山口");
    expect(titleFor(599).name).toBe("高尾山");
    expect(titleFor(3775).name).toBe("北岳");
    expect(titleFor(3776).name).toBe("富士山");
  });

  it("次の称号までの残りを返す", () => {
    expect(nextTitle(500)).toEqual({ title: TITLES[1], remaining: 99 });
    expect(nextTitle(99999)).toBeNull();
  });
});
