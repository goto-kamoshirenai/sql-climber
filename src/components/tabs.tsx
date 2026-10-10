"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

export type TabItem<K extends string> = { key: K; label: ReactNode };

/** WAI-ARIA の tabs パターン。左右キーで移動できる */
export function TabList<K extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
  className,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
  idPrefix: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((i) => i.key === value);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onChange(items[next]!.key);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`tabs ${className ?? ""}`}
      onKeyDown={onKeyDown}
    >
      {items.map((item, i) => (
        <button
          key={item.key}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${item.key}`}
          aria-selected={item.key === value}
          aria-controls={`${idPrefix}-panel-${item.key}`}
          tabIndex={item.key === value ? 0 : -1}
          className="tabs__tab"
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  idPrefix,
  tabKey,
  active,
  children,
  className,
  keepMounted = false,
}: {
  idPrefix: string;
  tabKey: string;
  active: boolean;
  children: ReactNode;
  className?: string;
  /** 非表示でも DOM に残す（エディタのように状態を持つもの） */
  keepMounted?: boolean;
}) {
  if (!active && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${tabKey}`}
      aria-labelledby={`${idPrefix}-tab-${tabKey}`}
      hidden={!active}
      className={`tabs__panel ${className ?? ""}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export function useTabsId(name: string) {
  return `${name}${useId().replace(/:/g, "")}`;
}
