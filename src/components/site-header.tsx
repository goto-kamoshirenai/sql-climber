"use client";

import Link from "next/link";
import { Icon, type IconName } from "dotterel-ui/icon";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { DIALECT_LABEL, type Dialect } from "@/features/engine/types";
import { titleFor, titleProgress } from "@/features/rank/titles";
import { progressActions, useHydrated, useProgress } from "@/features/storage/progress-store";
import type { Theme } from "@/features/storage/progress-schema";
import { LogoMark } from "./dot-art";
import { applyTheme } from "./theme-script";

const NAV = [
  { href: "/", label: "山を選ぶ" },
  { href: "/mypage", label: "登山手帳" },
  { href: "/resources", label: "学習リソース" },
  { href: "/about", label: "注意事項" },
];

const THEME_LABEL: Record<Theme, string> = { system: "自動", light: "昼", dark: "夜" };
const THEME_ICON: Record<Theme, IconName> = {
  system: "desktop",
  light: "theme-light",
  dark: "theme-dark",
};
const THEME_ORDER: Theme[] = ["system", "light", "dark"];

export function SiteHeader() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    applyTheme(progress.theme);
  }, [progress.theme]);

  // ページ遷移したらメニューを閉じる
  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);

  const rank = hydrated ? progress.rank : 0;
  const title = titleFor(rank);
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(progress.theme) + 1) % THEME_ORDER.length]!;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo" aria-label="SQL Climber ホーム">
          <LogoMark size={22} />
          <span className="site-logo__text">
            SQL <span className="site-logo__accent">CLIMBER</span>
          </span>
        </Link>

        <Link href="/mypage" className="rank-chip" title={`登山家ランク: ${title.name}`}>
          <span className="rank-chip__label">ランク</span>
          <span className="rank-chip__value">
            <span className="num">{rank.toLocaleString("ja-JP")} m</span>
          </span>
          <span className="rank-chip__title">{title.name}</span>
          <span className="rank-chip__meter" aria-hidden>
            <span style={{ inlineSize: `${titleProgress(rank) * 100}%` }} />
          </span>
        </Link>

        <div className="site-header__controls">
          <DialectSwitch value={progress.dialect} />
          <button
            type="button"
            className="icon-button"
            onClick={() => progressActions.setTheme(nextTheme)}
            aria-label={`表示テーマ: ${THEME_LABEL[progress.theme]}（押すと${THEME_LABEL[nextTheme]}に切り替え）`}
            title={`テーマ: ${THEME_LABEL[progress.theme]}`}
          >
            <Icon name={THEME_ICON[progress.theme]} size="sm" />
          </button>
        </div>

        <nav className="site-nav" aria-label="メインメニュー">
          <ul className="site-nav__list">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="site-nav__link"
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <details className="site-menu" ref={menuRef}>
          <summary className="icon-button" aria-label="メニュー">
            <span aria-hidden className="menu-glyph" />
          </summary>
          <ul className="site-menu__list">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </header>
  );
}

export function DialectSwitch({ value }: { value: Dialect }) {
  return (
    <div className="segmented" role="radiogroup" aria-label="SQL の種類">
      {(["sqlite", "postgres"] as const).map((d) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={value === d}
          className="segmented__item"
          onClick={() => progressActions.setDialect(d)}
        >
          {d === "sqlite" ? "SQLite" : "PostgreSQL"}
          <span className="visually-hidden">{value === d ? "（選択中）" : ""}</span>
        </button>
      ))}
      <span className="visually-hidden">現在: {DIALECT_LABEL[value]}</span>
    </div>
  );
}
