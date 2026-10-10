import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";
import {
  datasetMetaSchema,
  problemSourceSchema,
  type DatasetMeta,
  type ProblemSource,
} from "@/features/problem/schema";

/**
 * content/ を読み込んで検証済みの形で返す。
 * route handler（ビルド時の静的生成）と検証スクリプトの両方から使う。
 */

export type DatasetSource = DatasetMeta & { ddl: string; data: string };

export type ContentSource = {
  datasets: Map<string, DatasetSource>;
  problems: ProblemSource[];
};

export const CONTENT_DIR = path.join(process.cwd(), "content");

export class ContentError extends Error {
  constructor(file: string, detail: string) {
    super(`${path.relative(process.cwd(), file)}: ${detail}`);
    this.name = "ContentError";
  }
}

let cache: Promise<ContentSource> | null = null;

export function loadContent(): Promise<ContentSource> {
  // 開発時はファイル編集を即反映したいのでキャッシュしない
  if (process.env.NODE_ENV === "development") return readContent();
  cache ??= readContent();
  return cache;
}

async function readContent(): Promise<ContentSource> {
  const datasets = await readDatasets();
  const problems = await readProblems();

  for (const p of problems) {
    if ("ref" in p.dataset && !datasets.has(p.dataset.ref)) {
      throw new ContentError(problemFile(p.id), `dataset "${p.dataset.ref}" が存在しません`);
    }
  }
  const ids = new Set<string>();
  for (const p of problems) {
    if (ids.has(p.id)) throw new ContentError(problemFile(p.id), `id "${p.id}" が重複しています`);
    ids.add(p.id);
  }

  problems.sort((a, b) => a.grade - b.grade || a.altitude - b.altitude || a.id.localeCompare(b.id));
  return { datasets, problems };
}

async function readDatasets(): Promise<Map<string, DatasetSource>> {
  const root = path.join(CONTENT_DIR, "datasets");
  const dirs = (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory());
  const map = new Map<string, DatasetSource>();

  for (const dir of dirs) {
    const base = path.join(root, dir.name);
    const metaFile = path.join(base, "dataset.json");
    const meta = parseJson(metaFile, await readFile(metaFile, "utf8"), datasetMetaSchema);
    if (meta.id !== dir.name) {
      throw new ContentError(
        metaFile,
        `id "${meta.id}" とディレクトリ名 "${dir.name}" が一致しません`,
      );
    }
    const ddl = await readFile(path.join(base, "ddl.sql"), "utf8");
    const data = await readFile(path.join(base, "data.sql"), "utf8");
    map.set(meta.id, { ...meta, ddl, data });
  }
  return map;
}

async function readProblems(): Promise<ProblemSource[]> {
  const root = path.join(CONTENT_DIR, "problems");
  const files = (await readdir(root)).filter((f) => f.endsWith(".json")).sort();
  const problems: ProblemSource[] = [];

  for (const file of files) {
    const full = path.join(root, file);
    const problem = parseJson(full, await readFile(full, "utf8"), problemSourceSchema);
    if (`${problem.id}.json` !== file) {
      throw new ContentError(full, `id "${problem.id}" とファイル名が一致しません`);
    }
    problems.push(problem);
  }
  return problems;
}

function problemFile(id: string) {
  return path.join(CONTENT_DIR, "problems", `${id}.json`);
}

function parseJson<T>(file: string, text: string, schema: z.ZodType<T>): T {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new ContentError(file, `JSON として読めません: ${(error as Error).message}`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new ContentError(file, detail);
  }
  return parsed.data;
}

/** 問題の dataset 参照を解決する（inline の場合は問題IDから仮のIDを作る） */
export function resolveDatasetSource(
  problem: ProblemSource,
  datasets: Map<string, DatasetSource>,
): DatasetSource & { shared: boolean } {
  if ("ref" in problem.dataset) {
    return { ...datasets.get(problem.dataset.ref)!, shared: true };
  }
  return { id: `inline-${problem.id}`, ...problem.dataset.inline, shared: false };
}
