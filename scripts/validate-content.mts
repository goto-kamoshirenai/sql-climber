/**
 * コンテンツ検証（ADR-0011・CI必須ゲート）
 *
 *   pnpm validate:content            全問題を検証
 *   pnpm validate:content 0001 0002  指定した問題だけ検証
 *
 * 1. content/ のスキーマ検証（zod）
 * 2. データセットの DDL / data が sql.js と PGlite の両方で流れる
 * 3. dataset.json のテーブル情報と DDL の実構造が一致する
 * 4. 全問題の模範解答が両エンジンでエラーなく実行でき、空でない結果を返す
 * 5. 両エンジンの模範解答結果が judge で一致する（方言差による破れの検出）
 */
import { createNodeEngine } from "@/features/engine/node-engines";
import { countStatements } from "@/features/engine/statements";
import type { Engine, QueryResult } from "@/features/engine/types";
import { judge } from "@/features/judge/judge";
import type { TableMeta } from "@/features/problem/schema";
import { loadContent, resolveDatasetSource, type DatasetSource } from "@/server/content-source";

const errors: string[] = [];
const fail = (where: string, message: string) => errors.push(`✗ ${where}: ${message}`);

const only = new Set(process.argv.slice(2));

const content = await loadContent().catch((error: Error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});

const sqlite = await createNodeEngine("sqlite");
const postgres = await createNodeEngine("postgres");
const engines = [sqlite, postgres];

// --- データセット ---
for (const ds of content.datasets.values()) {
  await checkDataset(ds, `dataset ${ds.id}`);
}

// --- 問題 ---
const altitudes = new Map<number, string>();
for (const problem of content.problems) {
  const where = `problem ${problem.id}「${problem.title}」`;

  const dup = altitudes.get(problem.altitude);
  if (dup) fail(where, `標高 ${problem.altitude}m が問題 ${dup} と重複しています`);
  altitudes.set(problem.altitude, problem.id);

  if (only.size > 0 && !only.has(problem.id)) continue;

  const ds = resolveDatasetSource(problem, content.datasets);
  if (!ds.shared) await checkDataset(ds, `${where} (inline dataset)`);

  if (countStatements(problem.answer.sql) !== 1) {
    fail(where, "模範解答は1文である必要があります");
    continue;
  }
  for (const hint of problem.hints) {
    if (normalizeSql(hint).includes(normalizeSql(problem.answer.sql))) {
      fail(where, "ヒントに模範解答がそのまま含まれています");
    }
  }

  const results: QueryResult[] = [];
  for (const engine of engines) {
    try {
      await engine.reset(ds.ddl, ds.data);
      const result = await engine.query(problem.answer.sql);
      if (result.columns.length === 0) {
        fail(where, `[${engine.dialect}] 模範解答が結果列を返しません`);
        continue;
      }
      if (result.rows.length === 0 && !problem.answer.allowEmptyResult) {
        fail(
          where,
          `[${engine.dialect}] 模範解答の結果が0行です（意図的なら allowEmptyResult: true）`,
        );
      }
      results.push(result);
    } catch (error) {
      fail(where, `[${engine.dialect}] 模範解答の実行に失敗: ${(error as Error).message}`);
    }
  }

  const [a, b] = results;
  if (a && b) {
    const verdict = judge(a, b, { orderSensitive: problem.answer.orderSensitive });
    if (!verdict.correct) {
      fail(
        where,
        `SQLite と PostgreSQL で模範解答の結果が一致しません（${verdict.reason}）\n    sqlite:   ${preview(a)}\n    postgres: ${preview(b)}`,
      );
    }
  }
}

await Promise.all(engines.map((e) => e.dispose()));

const checked = only.size > 0 ? only.size : content.problems.length;
if (errors.length > 0) {
  console.error(errors.join("\n"));
  console.error(
    `\n${errors.length} 件の問題があります（データセット ${content.datasets.size} / 問題 ${checked}）`,
  );
  process.exit(1);
}
console.log(`✓ コンテンツ検証OK（データセット ${content.datasets.size} / 問題 ${checked}）`);

// ------------------------------------------------------------------

async function checkDataset(ds: DatasetSource, where: string) {
  for (const engine of engines) {
    try {
      await engine.reset(ds.ddl, ds.data);
    } catch (error) {
      fail(where, `[${engine.dialect}] DDL/データの投入に失敗: ${(error as Error).message}`);
      return;
    }
  }
  await sqlite.reset(ds.ddl, ds.data);
  await checkTablesMatchDdl(sqlite, ds.tables, where);
}

/** dataset.json の tables と、SQLite に実際に作られたテーブル構造を突き合わせる */
async function checkTablesMatchDdl(engine: Engine, tables: TableMeta[], where: string) {
  const actualTables = (
    await engine.query("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  ).rows.map((r) => String(r[0]));
  const metaTables = tables.map((t) => t.name).sort();
  if (actualTables.join(",") !== metaTables.join(",")) {
    fail(
      where,
      `テーブル一覧が DDL と一致しません（meta: ${metaTables.join(",")} / ddl: ${actualTables.join(",")}）`,
    );
    return;
  }

  for (const table of tables) {
    const info = await engine.query(`PRAGMA table_info(${table.name})`);
    // cid, name, type, notnull, dflt_value, pk
    const actual = info.rows.map(
      (r) => `${r[1]}:${String(r[2]).toUpperCase()}:${Number(r[5]) > 0 ? "pk" : ""}`,
    );
    const meta = table.columns.map((c) => `${c.name}:${c.type}:${c.pk ? "pk" : ""}`);
    if (actual.join(",") !== meta.join(",")) {
      fail(
        where,
        `${table.name} のカラム定義が DDL と一致しません\n    meta: ${meta.join(", ")}\n    ddl:  ${actual.join(", ")}`,
      );
    }

    const fks = await engine.query(`PRAGMA foreign_key_list(${table.name})`);
    // id, seq, table, from, to, ...
    const actualFk = fks.rows.map((r) => `${r[3]}->${r[2]}.${r[4]}`).sort();
    const metaFk = table.foreignKeys
      .map((f) => `${f.column}->${f.references.table}.${f.references.column}`)
      .sort();
    if (actualFk.join(",") !== metaFk.join(",")) {
      fail(
        where,
        `${table.name} の外部キーが DDL と一致しません（meta: ${metaFk.join(",") || "なし"} / ddl: ${actualFk.join(",") || "なし"}）`,
      );
    }
  }
}

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").replace(/;\s*$/, "").trim().toLowerCase();
}

function preview(r: QueryResult) {
  return (
    JSON.stringify(r.rows.slice(0, 5), (_, v) => (typeof v === "bigint" ? Number(v) : v)) +
    (r.rows.length > 5 ? ` …(${r.rows.length}行)` : "")
  );
}
