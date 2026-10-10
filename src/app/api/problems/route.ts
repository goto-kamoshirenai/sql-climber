import { listProblems } from "@/server/content";

export const dynamic = "force-static";

/** 問題一覧（全帯）。件数が少ないので帯の絞り込みはクライアントで行う */
export async function GET() {
  return Response.json({ problems: await listProblems() });
}
