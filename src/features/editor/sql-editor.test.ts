import { describe, expect, it } from "vitest";
import { spaced } from "./sql-editor";

describe("spaced（入力補助バーの空白補完）", () => {
  it("単語の直後にキーワードを入れると前に空白を補う", () => {
    expect(spaced("FROM", "*", "")).toBe(" FROM ");
  });
  it("行頭や空白の後では前に空白を入れない", () => {
    expect(spaced("SELECT", "", "")).toBe("SELECT ");
    expect(spaced("WHERE", " ", "")).toBe("WHERE ");
  });
  it("後ろが空白なら後ろには入れない", () => {
    expect(spaced("AND", " ", " x")).toBe("AND");
  });
  it("カンマと閉じかっこは前に空白を入れない", () => {
    expect(spaced(",", "a", "")).toBe(", ");
    expect(spaced(")", "a", "")).toBe(") ");
  });
  it("開きかっこの後ろには空白を入れない", () => {
    expect(spaced("(", "COUNT", "")).toBe("(");
  });
});
