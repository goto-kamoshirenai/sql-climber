import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // AI 向けの AGENTS.md を自動生成しない（AI 設定は公開リポジトリに含めない方針）
  agentRules: false,
  devIndicators: false,
  // content/ はビルド時に route handler から読む（静的生成）
  outputFileTracingIncludes: {
    "/api/**": ["./content/**/*"],
  },
  async headers() {
    // 開発中は content/ の編集がすぐ見えるよう、ブラウザにキャッシュさせない
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/wasm/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
