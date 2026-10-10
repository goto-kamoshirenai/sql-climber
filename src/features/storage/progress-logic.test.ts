import { describe, expect, it } from "vitest";
import { applyDraft, applySubmission, applySurrender } from "./progress-logic";
import { INITIAL_PROGRESS, progressSchema } from "./progress-schema";

const now = new Date("2026-10-10T03:00:00Z");

describe("applySubmission", () => {
  it("初回正解でランクがジャンプし、solved になる", () => {
    const { progress, ascent } = applySubmission(INITIAL_PROGRESS, "0001", 450, true, now);
    expect(ascent).toEqual({ firstAscent: true, rankBefore: 0, rankAfter: 450 });
    expect(progress.history["0001"]).toMatchObject({
      status: "solved",
      attempts: 1,
      solvedAt: now.toISOString(),
    });
  });

  it("2回目以降の正解ではランクは変わらない", () => {
    const first = applySubmission(INITIAL_PROGRESS, "0001", 450, true, now).progress;
    const { progress, ascent } = applySubmission(first, "0001", 450, true, now);
    expect(ascent.firstAscent).toBe(false);
    expect(progress.rank).toBe(450);
    expect(progress.history["0001"]?.attempts).toBe(2);
  });

  it("不正解は提出回数だけ増える", () => {
    const { progress, ascent } = applySubmission(INITIAL_PROGRESS, "0001", 450, false, now);
    expect(ascent.rankAfter).toBe(0);
    expect(progress.history["0001"]).toMatchObject({
      status: "attempted",
      attempts: 1,
      solvedAt: null,
    });
  });

  it("降参後の正解は増分が半減し solved_after_surrender になる", () => {
    const surrendered = applySurrender(INITIAL_PROGRESS, "0001");
    const { progress, ascent } = applySubmission(surrendered, "0001", 450, true, now);
    expect(ascent.rankAfter).toBe(225);
    expect(progress.history["0001"]?.status).toBe("solved_after_surrender");
  });
});

describe("applySurrender", () => {
  it("正解済みの問題には影響しない", () => {
    const solved = applySubmission(INITIAL_PROGRESS, "0001", 450, true, now).progress;
    expect(applySurrender(solved, "0001")).toBe(solved);
  });
});

describe("applyDraft", () => {
  it("書きかけを保存し、状態は attempted のまま", () => {
    const p = applyDraft(INITIAL_PROGRESS, "0002", "SELECT");
    expect(p.history["0002"]).toMatchObject({
      status: "attempted",
      lastQuery: "SELECT",
      attempts: 0,
    });
  });

  it("結果はスキーマを満たす", () => {
    const p = applyDraft(applySurrender(INITIAL_PROGRESS, "0003"), "0002", "x");
    expect(progressSchema.safeParse(p).success).toBe(true);
  });
});
