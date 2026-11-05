import { ImageResponse } from "next/og";
import { BRAND_COLORS } from "@/components/brand";
import { BrandLogoSvg } from "@/components/brand-svg";
import { GRADES } from "@/features/problem/grades";

export const alt = "SQL Climber — SQL を一歩ずつ登る問題集";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 画像の既定フォント（Geist）は和文を持たないので、画像内の文字は英語にする */
const TAGLINE = "Learn SQL in your browser, one step at a time.";
const SUBLINE = "From SELECT at the foot to window functions at 3,776 m.";

/** 背景の稜線（難易度帯ごとに高くなる段々の山） */
const RIDGE = GRADES.map((grade, i) => ({
  grade,
  height: 90 + i * 70,
}));

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px 0",
        background: BRAND_COLORS.night,
        color: BRAND_COLORS.paper,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 32,
            border: `2px solid ${BRAND_COLORS.forest}`,
          }}
        >
          <BrandLogoSvg size={92} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 72, letterSpacing: 8 }}>
            <span style={{ marginRight: 24 }}>SQL</span>
            <span style={{ color: BRAND_COLORS.amber }}>CLIMBER</span>
          </div>
          <div style={{ fontSize: 30, opacity: 0.8 }}>{TAGLINE}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 26, opacity: 0.6 }}>{SUBLINE}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          {RIDGE.map(({ grade, height }, i) => (
            <div
              key={grade}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                flex: 1,
                height,
                paddingTop: 16,
                borderRadius: "16px 16px 0 0",
                background: i === RIDGE.length - 1 ? BRAND_COLORS.amber : BRAND_COLORS.forest,
                color: i === RIDGE.length - 1 ? BRAND_COLORS.night : BRAND_COLORS.paper,
                fontSize: 28,
              }}
            >
              {grade.toLocaleString("en-US")} m
            </div>
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
