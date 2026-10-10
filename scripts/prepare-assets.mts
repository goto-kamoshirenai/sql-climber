/**
 * dev / build の前に実行する生成処理
 *  1. SQLエンジンの wasm を public/wasm/ に配置（ブラウザから遅延ロードする）
 *  2. 共有データセットの E-R 図を Mermaid 記法から SVG に変換し public/er/ に出力（ADR-0010）
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { renderMermaidSVG } from "beautiful-mermaid";
import { loadContent } from "@/server/content-source";
import { toErDiagram } from "@/server/er-diagram";

const require = createRequire(import.meta.url);
const root = process.cwd();

// --- 1. wasm ---
const wasmDir = path.join(root, "public", "wasm");
await mkdir(wasmDir, { recursive: true });

const sqlJsDist = path.dirname(require.resolve("sql.js/dist/sql-wasm.js"));
const pgliteDist = path.dirname(require.resolve("@electric-sql/pglite"));
const wasmFiles: [string, string][] = [
  [path.join(sqlJsDist, "sql-wasm-browser.wasm"), "sql-wasm-browser.wasm"],
  [path.join(sqlJsDist, "sql-wasm.wasm"), "sql-wasm.wasm"],
  [path.join(pgliteDist, "pglite.wasm"), "pglite.wasm"],
  [path.join(pgliteDist, "pglite.data"), "pglite.data"],
  [path.join(pgliteDist, "initdb.wasm"), "initdb.wasm"],
];
for (const [from, name] of wasmFiles) {
  await copyFile(from, path.join(wasmDir, name));
}

// --- 2. E-R 図 ---
const erDir = path.join(root, "public", "er");
await mkdir(erDir, { recursive: true });

// <img> で表示する（SVG 内の <style> をページに漏らさない）ため、テーマごとに実色で2枚作る。
// 色は src/app/globals.css のテーマトークンと揃える
const ER_THEMES = {
  light: {
    bg: "#ffffff",
    fg: "#2b2b28",
    line: "#8f8a7e",
    accent: "#2e6e4e",
    muted: "#6e6a60",
    surface: "#f6f4ee",
    border: "#c9c3b5",
  },
  dark: {
    bg: "#18222f",
    fg: "#e8e6df",
    line: "#5d6b80",
    accent: "#e8a33d",
    muted: "#8b93a1",
    surface: "#101722",
    border: "#3a4a60",
  },
} as const;

const { datasets } = await loadContent();
for (const ds of datasets.values()) {
  for (const [theme, colors] of Object.entries(ER_THEMES)) {
    const svg = renderMermaidSVG(toErDiagram(ds.tables), { ...colors, font: "system-ui" })
      // 外部フォントの読み込みは不要（<img> 内では読まれず、軽量化方針にも反する）
      .replace(/^\s*@import url\([^)]*\);\s*$/gm, "");
    await writeFile(path.join(erDir, `${ds.id}.${theme}.svg`), svg);
  }
}

console.log(`✓ assets: wasm ${wasmFiles.length} files / E-R ${datasets.size} diagrams`);
