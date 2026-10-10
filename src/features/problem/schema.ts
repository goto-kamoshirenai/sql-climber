import { z } from "zod";
import { GRADES, altitudeFitsGrade } from "./grades";

/* ------------------------------------------------------------------
 * content/ 配下のソースファイルの形（サーバー・検証スクリプトで使用）
 * ------------------------------------------------------------------ */

export const columnSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INTEGER", "TEXT", "REAL"]),
  pk: z.boolean().optional(),
  description: z.string().min(1),
});

export const foreignKeySchema = z.object({
  column: z.string().min(1),
  references: z.object({ table: z.string().min(1), column: z.string().min(1) }),
});

export const tableSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  columns: z.array(columnSchema).min(1),
  foreignKeys: z.array(foreignKeySchema).default([]),
});

/** dataset.json（DDL/データは別ファイル） */
export const datasetMetaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().min(1),
  tables: z.array(tableSchema).min(1),
});

export const inlineDatasetSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tables: z.array(tableSchema).min(1),
  ddl: z.string().min(1),
  data: z.string().min(1),
});

export const problemSourceSchema = z
  .object({
    id: z.string().regex(/^\d{4}$/),
    title: z.string().min(1),
    grade: z.literal(GRADES),
    altitude: z.number().int().positive(),
    dataset: z.union([
      z.object({ ref: z.string().min(1) }),
      z.object({ inline: inlineDatasetSchema }),
    ]),
    statement: z.string().min(1),
    hints: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
    answer: z.object({
      sql: z.string().min(1),
      explanation: z.string().min(1),
      orderSensitive: z.boolean(),
      verifyQuery: z.string().min(1).nullable(),
      /** 正解が0行になる出題を意図的に許可する */
      allowEmptyResult: z.boolean().optional(),
    }),
  })
  .refine((p) => altitudeFitsGrade(p.altitude, p.grade), {
    message: "altitude が grade の範囲外です",
    path: ["altitude"],
  });

export type ColumnMeta = z.infer<typeof columnSchema>;
export type TableMeta = z.infer<typeof tableSchema>;
export type DatasetMeta = z.infer<typeof datasetMetaSchema>;
export type ProblemSource = z.infer<typeof problemSourceSchema>;

/* ------------------------------------------------------------------
 * API レスポンスの形（クライアントが受け取るもの）
 * ------------------------------------------------------------------ */

export type ProblemSummary = {
  id: string;
  title: string;
  grade: ProblemSource["grade"];
  altitude: number;
  datasetId: string;
  datasetName: string;
};

export type ResolvedDataset = {
  id: string;
  name: string;
  description: string;
  tables: TableMeta[];
  ddl: string;
  data: string;
  /** inline データセットは E-R 図を持たない */
  erSvg: { light: string; dark: string } | null;
};

export type ProblemDetail = {
  id: string;
  title: string;
  grade: ProblemSource["grade"];
  altitude: number;
  /** Markdown をサーバーで HTML 化したもの */
  statementHtml: string;
  hintsHtml: [string, string, string];
  dataset: ResolvedDataset;
  /** 同じ帯の次の問題（なければ null） */
  nextId: string | null;
};

export type ProblemAnswer = {
  sql: string;
  explanationHtml: string;
  orderSensitive: boolean;
  verifyQuery: string | null;
};
