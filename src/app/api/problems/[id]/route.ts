import { getProblemDetail, listProblemIds } from "@/server/content";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listProblemIds()).map((id) => ({ id }));
}

/** 問題詳細（模範解答は含まない） */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProblemDetail(id);
  if (!detail) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(detail);
}
