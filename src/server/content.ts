import { Marked, marked } from "marked";
import type { Grade } from "@/features/problem/grades";
import type {
  ProblemAnswer,
  ProblemDetail,
  ProblemSummary,
  ResolvedDataset,
} from "@/features/problem/schema";
import { loadContent, resolveDatasetSource, type DatasetSource } from "./content-source";

/** API が返す形への変換（docs/design/03-data-api.md） */

function md(text: string): string {
  return marked.parse(text, { async: false, gfm: true, breaks: true });
}

/**
 * 問題文用: SQL にそのまま書き写すもの（テーブル名・カラム名・値）のインラインコードに
 * コピーボタンを付ける。タイプミスで先へ進めない、という本質的でない障壁を減らすため。
 * クリック処理は info-panel 側のイベント委譲で行う。
 */
const statementMarked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    codespan({ text }) {
      const code = `<code>${escapeHtml(text)}</code>`;
      if (!isCopyable(text)) return code;
      const attr = escapeHtml(text);
      return `<span class="copyable">${code}<button type="button" class="copy-button" data-copy="${attr}" aria-label="${attr} をコピー" title="コピー"></button></span>`;
    },
  },
});

/** キーワード（`LEFT JOIN`・`RANK` など）や書式の説明（`ROUND(値, 1)`・`'YYYY-MM-DD'`）は写すものではない */
function isCopyable(text: string): boolean {
  if (/値|YYYY/.test(text)) return false;
  return !/^[A-Z][A-Z_ ]*(\(.*\))?$/.test(text);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statementMd(text: string): string {
  return statementMarked.parse(text, { async: false });
}

export async function listProblems(grade?: Grade): Promise<ProblemSummary[]> {
  const { problems, datasets } = await loadContent();
  return problems
    .filter((p) => grade === undefined || p.grade === grade)
    .map((p) => {
      const ds = resolveDatasetSource(p, datasets);
      return {
        id: p.id,
        title: p.title,
        grade: p.grade,
        altitude: p.altitude,
        datasetId: ds.id,
        datasetName: ds.name,
      };
    });
}

export async function listProblemIds(): Promise<string[]> {
  const { problems } = await loadContent();
  return problems.map((p) => p.id);
}

export async function getProblemDetail(id: string): Promise<ProblemDetail | null> {
  const { problems, datasets } = await loadContent();
  const index = problems.findIndex((p) => p.id === id);
  const problem = problems[index];
  if (!problem) return null;

  const next = problems[index + 1];
  const ds = resolveDatasetSource(problem, datasets);

  return {
    id: problem.id,
    title: problem.title,
    grade: problem.grade,
    altitude: problem.altitude,
    statementHtml: statementMd(problem.statement),
    hintsHtml: problem.hints.map(md) as [string, string, string],
    dataset: toResolvedDataset(ds, ds.shared),
    nextId: next && next.grade === problem.grade ? next.id : null,
  };
}

export async function getProblemAnswer(id: string): Promise<ProblemAnswer | null> {
  const { problems } = await loadContent();
  const problem = problems.find((p) => p.id === id);
  if (!problem) return null;
  return {
    sql: problem.answer.sql,
    explanationHtml: md(problem.answer.explanation),
    orderSensitive: problem.answer.orderSensitive,
    verifyQuery: problem.answer.verifyQuery,
  };
}

export async function getDataset(id: string): Promise<ResolvedDataset | null> {
  const { datasets } = await loadContent();
  const ds = datasets.get(id);
  return ds ? toResolvedDataset(ds, true) : null;
}

export async function listDatasetIds(): Promise<string[]> {
  const { datasets } = await loadContent();
  return [...datasets.keys()];
}

function toResolvedDataset(ds: DatasetSource, shared: boolean): ResolvedDataset {
  return {
    id: ds.id,
    name: ds.name,
    description: ds.description,
    tables: ds.tables,
    ddl: ds.ddl,
    data: ds.data,
    erSvg: shared ? { light: `/er/${ds.id}.light.svg`, dark: `/er/${ds.id}.dark.svg` } : null,
  };
}
