import { describe, expect, it } from "vitest";
import { countStatements } from "./statements";

describe("countStatements", () => {
  it.each([
    ["SELECT 1", 1],
    ["SELECT 1;", 1],
    ["SELECT 1;  \n", 1],
    ["SELECT 1; SELECT 2", 2],
    ["SELECT 1;;", 1],
    ["", 0],
    ["  -- comment only\n", 0],
    ["SELECT ';' AS semi", 1],
    ["SELECT 'it''s; fine'", 1],
    ['SELECT 1 AS "a;b"', 1],
    ["SELECT 1 -- ; comment\n", 1],
    ["SELECT 1 /* ; */ ; /* trailing */", 1],
    ["SELECT 1; -- next\nSELECT 2;", 2],
  ])("%j は %i 文", (sql, expected) => {
    expect(countStatements(sql)).toBe(expected);
  });
});
