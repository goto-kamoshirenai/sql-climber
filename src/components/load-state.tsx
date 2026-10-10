"use client";

import { DotButton } from "dotterel-ui/button";
import type { Loadable } from "@/features/problem/api";

/** Loadable の loading / error を共通の見た目で出す。ready のときだけ children を描く */
export function LoadState<T>({
  value,
  children,
  loadingLabel = "読み込み中…",
}: {
  value: Loadable<T>;
  children: (data: T) => React.ReactNode;
  loadingLabel?: string;
}) {
  if (value.state === "loading") {
    return (
      <p className="load-state" role="status">
        <span className="load-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        {loadingLabel}
      </p>
    );
  }
  if (value.state === "error") {
    return (
      <div className="load-state load-state--error" role="alert">
        <p>{value.error.message}。通信の状態を確かめて、もう一度お試しください。</p>
        <DotButton onClick={value.retry}>再読み込み</DotButton>
      </div>
    );
  }
  return <>{children(value.data)}</>;
}
