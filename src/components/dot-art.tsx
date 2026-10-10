import type { CSSProperties } from "react";

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

  const cells: { x: number; y: number; cls: string }[] = [];
  for (const layer of layers) {
    layer.heights.forEach((h, col) => {
      for (let r = 0; r < h; r++) {
        const isSnow = layer.className === "dot-art__front" && r >= snowLine;
        cells.push({ x: col, y: ROWS - 1 - r, cls: isSnow ? "dot-art__snow" : layer.className });
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

/** ロゴマーク（9×9 の小さな山と旗） */
const LOGO = [
  "......##.",
  "......###",
  "......#..",
  "....#.#..",
  "...###...",
  "..#####..",
  ".#######.",
  "####.####",
  "#########",
];

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 9 9"
      width={size}
      height={size}
      aria-hidden
      shapeRendering="crispEdges"
      className="logo-mark"
    >
      {LOGO.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "#" ? (
            <rect
              key={`${x}-${y}`}
              x={x + 0.08}
              y={y + 0.08}
              width={0.84}
              height={0.84}
              className={y <= 2 && x >= 6 ? "logo-mark__flag" : "logo-mark__rock"}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
