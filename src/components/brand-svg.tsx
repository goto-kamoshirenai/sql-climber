import { BRAND_COLORS, LOGO_CURSOR, LOGO_MOUNTAIN, LOGO_VIEWBOX } from "./brand";

/** 画像生成（next/og）用のロゴ。CSS 変数が使えないので色を直接渡す */
export function BrandLogoSvg({
  size,
  rock = BRAND_COLORS.snow,
  accent = BRAND_COLORS.amber,
}: {
  size: number;
  rock?: string;
  accent?: string;
}) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}>
      <path d={LOGO_MOUNTAIN} fill={rock} />
      <rect {...LOGO_CURSOR} fill={accent} />
    </svg>
  );
}
