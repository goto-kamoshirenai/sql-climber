import { getProblemAnswer, listProblemIds } from "@/server/content";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listProblemIds()).map((id) => ({ id }));
}

/** 模範解答と解説。提出時・降参時にだけ取得する（ADR-0007） */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const answer = await getProblemAnswer(id);
  if (!answer) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(answer);
}
