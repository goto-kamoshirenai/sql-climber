/** 難易度帯（〜m級）。値は帯の上限標高。 */
export const GRADES = [500, 1500, 2500, 3776] as const;
export type Grade = (typeof GRADES)[number];

export type GradeInfo = {
  grade: Grade;
  /** 帯の下限標高（この値を含む） */
  min: number;
  label: string;
  summary: string;
};

export const GRADE_INFO: Record<Grade, GradeInfo> = {
  500: {
    grade: 500,
    min: 1,
    label: "〜500m級",
    summary: "SELECT と WHERE で、必要な行と列を取り出す",
  },
  1500: {
    grade: 1500,
    min: 501,
    label: "〜1500m級",
    summary: "集計と GROUP BY で、データを要約する",
  },
  2500: {
    grade: 2500,
    min: 1501,
    label: "〜2500m級",
    summary: "JOIN とサブクエリで、テーブルをまたぐ",
  },
  3776: {
    grade: 3776,
    min: 2501,
    label: "〜3776m級",
    summary: "相関サブクエリとウィンドウ関数で、山頂へ",
  },
};

export function isGrade(value: unknown): value is Grade {
  return GRADES.includes(Number(value) as Grade);
}

/** 標高がその難易度帯の範囲に収まっているか */
export function altitudeFitsGrade(altitude: number, grade: Grade): boolean {
  return altitude >= GRADE_INFO[grade].min && altitude <= grade;
}
