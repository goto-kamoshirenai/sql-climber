/**
 * ロゴマーク「階段稜線」（24×24）。
 * 左の稜線は 4×4 マスの段で「一歩ずつ」、右は鋭い斜面で「山」。段はピクセルや結果表の行にも見える。
 * 頂上の縦辺の延長上に、カーソルの旗が待つ。
 * ヘッダーのロゴ・アプリアイコン・OGP 画像で同じ形を使う（src/app/icon.svg も同じ座標）。
 */
export const LOGO_VIEWBOX = 24;

/** 山（左が階段、右が斜面） */
export const LOGO_MOUNTAIN = "M1 22 V18 H5 V14 H9 V10 H13 V6 L23 22 Z";

/** 頂上のカーソル */
export const LOGO_CURSOR = { x: 10, y: 1, width: 3, height: 3 } as const;

/** 画像生成用の配色（CSS 変数が使えない場面で使う） */
export const BRAND_COLORS = {
  paper: "#f6f4ee",
  snow: "#e8e6df",
  forest: "#2e6e4e",
  amber: "#e8a33d",
  night: "#101722",
} as const;
