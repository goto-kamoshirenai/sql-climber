import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "dotterel-ui/styles.css";
import "./globals.css";
import "./components.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT } from "@/components/theme-script";

// 等幅（SQL・結果表）だけ Web フォント。和文は OS のフォントを使う（軽量化）
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SQL Climber — SQL を一歩ずつ登る問題集",
    template: "%s | SQL Climber",
  },
  description:
    "ブラウザの中で SQL を書いて、実行して、山頂を目指す。SQLite と PostgreSQL に対応した、初学者のための SQL 問題集です。",
  openGraph: {
    title: "SQL Climber",
    description: "SQL を一歩ずつ登る問題集。ブラウザだけで SQL を実行して学べます。",
    locale: "ja_JP",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 仮想キーボードが出たらレイアウトを縮め、下部の入力補助バーをキーボードの上に置く
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#101722" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={jetbrains.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <SiteHeader />
        <main id="main" className="site-main">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
