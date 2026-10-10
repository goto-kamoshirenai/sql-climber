import type { Metadata } from "next";
import { Workspace } from "@/features/workspace/workspace";
import { listProblemIds, listProblems } from "@/server/content";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listProblemIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const problem = (await listProblems()).find((p) => p.id === id);
  return { title: problem ? `${problem.title}（${problem.altitude}m）` : `問題 ${id}` };
}

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Workspace id={id} />;
}
