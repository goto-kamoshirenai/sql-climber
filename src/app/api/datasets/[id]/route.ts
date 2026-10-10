import { getDataset, listDatasetIds } from "@/server/content";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listDatasetIds()).map((id) => ({ id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dataset = await getDataset(id);
  if (!dataset) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(dataset);
}
