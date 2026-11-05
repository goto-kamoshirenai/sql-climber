import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MountainArt } from "@/components/dot-art";
import { ProblemList } from "@/components/problem-list";
import { GRADES, GRADE_INFO, isGrade } from "@/features/problem/grades";

export const dynamicParams = false;

export function generateStaticParams() {
  return GRADES.map((grade) => ({ grade: String(grade) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string }>;
}): Promise<Metadata> {
  const { grade } = await params;
  return isGrade(grade)
    ? { title: GRADE_INFO[Number(grade) as keyof typeof GRADE_INFO].label }
    : {};
}

export default async function ProblemsPage({ params }: { params: Promise<{ grade: string }> }) {
  const { grade: raw } = await params;
  if (!isGrade(raw)) notFound();
  const grade = Number(raw) as (typeof GRADES)[number];
  const info = GRADE_INFO[grade];
  const index = GRADES.indexOf(grade);
  const prev = GRADES[index - 1];
  const next = GRADES[index + 1];

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link href="/">山を選ぶ</Link> <span aria-hidden>/</span> {info.label}
      </p>
      <header className="grade-head">
        <div>
          <p className="grade-head__alt">
            {info.min.toLocaleString("ja-JP")}m – {grade.toLocaleString("ja-JP")}m
          </p>
          <h1 className="page-title">{info.label}</h1>
          <p className="page-lead">{info.summary}。標高の低い問題から順に登ります。</p>
        </div>
        <MountainArt level={index as 0 | 1 | 2 | 3} className="grade-head__art" />
      </header>

      <ProblemList grade={grade} />

      <nav className="grade-nav" aria-label="ほかの山">
        {prev ? <Link href={`/problems/${prev}`}>← {GRADE_INFO[prev].label}</Link> : <span />}
        {next ? <Link href={`/problems/${next}`}>{GRADE_INFO[next].label} →</Link> : <span />}
      </nav>
    </div>
  );
}
