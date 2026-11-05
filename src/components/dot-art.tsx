import type { CSSProperties } from "react";
import { LOGO_CURSOR, LOGO_MOUNTAIN, LOGO_VIEWBOX } from "./brand";

/**
 * ドットで描く山（ドット登山地図の基本モチーフ）。
 * 標高に応じて険しさの違う稜線を、正方形のドットで塗る。
 */

type Layer = { heights: number[]; className: string };

const COLS = 28;
const ROWS = 18;

/** 山頂の高さ（行数）と稜線の険しさから、各列の高さを作る */
function ridge(peakCol: number, peakHeight: number, steepness: number, shoulder: number): number[] {
  return Array.from({ length: COLS }, (_, col) => {
    const d = Math.abs(col - peakCol);
    const main = peakHeight - d * steepness;
    // 肩（なだらかな尾根）を足して、単純な三角形にしない
    const side = peakHeight * 0.55 - Math.abs(col - (peakCol + shoulder)) * (steepness * 0.7);
    return Math.max(0, Math.round(Math.max(main, side)));
  });
}

/** 難易度帯ごとの森林限界（行数） */
const TREE_LINES = [5, 5, 4, 3] as const;

const PROFILES = [
  { peak: 6, steep: 0.55, shoulder: 6, back: 4 },
  { peak: 9, steep: 0.8, shoulder: -6, back: 6 },
  { peak: 13, steep: 1.1, shoulder: 5, back: 8 },
  { peak: 17, steep: 1.35, shoulder: -5, back: 10 },
] as const;

export function MountainArt({
  level,
  className,
  flag = false,
  title,
}: {
  /** 0〜3（難易度帯の順） */
  level: 0 | 1 | 2 | 3;
  className?: string;
  /** 山頂に旗を立てる（登頂演出） */
  flag?: boolean;
  title?: string;
}) {
  const p = PROFILES[level];
  const peakCol = 14;
  const front = ridge(peakCol, p.peak, p.steep, p.shoulder);
  const back = ridge(peakCol + (p.shoulder > 0 ? -7 : 7), p.back, p.steep * 0.8, 0);
  const layers: Layer[] = [
    { heights: back, className: "dot-art__back" },
    { heights: front, className: "dot-art__front" },
  ];
  const snowLine = level >= 2 ? p.peak - (level === 3 ? 4 : 2) : Infinity;
  // 森林限界: 低い山ほど上まで木が茂る
  const treeLine = TREE_LINES[level];

  const cells: { x: number; y: number; cls: string }[] = [];
  for (const layer of layers) {
    layer.heights.forEach((h, col) => {
      for (let r = 0; r < h; r++) {
        const front = layer.className === "dot-art__front";
        const cls =
          front && r >= snowLine
            ? "dot-art__snow"
            : front && r < treeLine - (col % 3 === 0 ? 1 : 0)
              ? "dot-art__forest"
              : layer.className;
        cells.push({ x: col, y: ROWS - 1 - r, cls });
      }
    });
  }

  const peakY = ROWS - p.peak;
  return (
    <svg
      viewBox={`0 0 ${COLS} ${ROWS}`}
      className={`dot-art ${className ?? ""}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      shapeRendering="crispEdges"
    >
      {cells.map((c, i) => (
        <rect key={i} x={c.x + 0.1} y={c.y + 0.1} width={0.8} height={0.8} className={c.cls} />
      ))}
      {flag && (
        <g className="dot-art__flag" style={{ "--peak-y": peakY } as CSSProperties}>
          {[1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={peakCol + 0.1}
              y={peakY - i + 0.1}
              width={0.8}
              height={0.8}
              className="dot-art__pole"
            />
          ))}
          {[
            [1, 4],
            [2, 4],
            [3, 4],
            [1, 3],
            [2, 3],
          ].map(([dx, dy]) => (
            <rect
              key={`${dx}-${dy}`}
              x={peakCol + dx! + 0.1}
              y={peakY - dy! + 0.1}
              width={0.8}
              height={0.8}
              className="dot-art__cloth"
            />
          ))}
        </g>
      )}
    </svg>
  );
}

/** ロゴマーク「階段稜線」。形は brand.ts */
export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}
      width={size}
      height={size}
      aria-hidden
      className={`logo-mark ${className ?? ""}`}
    >
      <path d={LOGO_MOUNTAIN} className="logo-mark__mountain" />
      <rect {...LOGO_CURSOR} className="logo-mark__cursor" />
    </svg>
  );
}
