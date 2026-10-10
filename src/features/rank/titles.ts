/** 登山家ランクの称号（実在の山）。minRank の昇順 */
export const TITLES = [
  { minRank: 0, name: "登山口", note: "これから登りはじめる" },
  { minRank: 599, name: "高尾山", note: "東京都・599m" },
  { minRank: 877, name: "筑波山", note: "茨城県・877m" },
  { minRank: 1252, name: "大山", note: "神奈川県・1252m" },
  { minRank: 1828, name: "赤城山", note: "群馬県・1828m" },
  { minRank: 1977, name: "谷川岳", note: "群馬県・新潟県・1977m" },
  { minRank: 2899, name: "赤岳", note: "八ヶ岳連峰の主峰・2899m" },
  { minRank: 3193, name: "北岳", note: "日本第二の高峰・3193m" },
  { minRank: 3776, name: "富士山", note: "日本最高峰・3776m" },
  { minRank: 4805, name: "モンブラン", note: "アルプス最高峰・約4805m" },
  { minRank: 5895, name: "キリマンジャロ", note: "アフリカ最高峰・5895m" },
  { minRank: 6961, name: "アコンカグア", note: "南米最高峰・6961m" },
  { minRank: 8849, name: "エベレスト", note: "世界最高峰・8849m" },
] as const;

export type Title = (typeof TITLES)[number];

export function titleFor(rank: number): Title {
  let current: Title = TITLES[0];
  for (const t of TITLES) {
    if (rank >= t.minRank) current = t;
  }
  return current;
}

/** 次の称号と、そこまでの残り標高。最高位なら null */
export function nextTitle(rank: number): { title: Title; remaining: number } | null {
  const next = TITLES.find((t) => t.minRank > rank);
  return next ? { title: next, remaining: next.minRank - rank } : null;
}
