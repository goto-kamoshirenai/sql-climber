"use client";

import Link from "next/link";
import { DotButton } from "dotterel-ui/button";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LoadState } from "@/components/load-state";
import { TabList, TabPanel, useTabsId } from "@/components/tabs";
import { SqlEditor, type SqlEditorHandle } from "@/features/editor/sql-editor";
import { getEngineHost, type EngineHost } from "@/features/engine/engine-host";
import { DIALECT_LABEL } from "@/features/engine/types";
import { runQuery, submitQuery, type ExecutionOutcome } from "@/features/judge/submit";
import { GRADE_INFO } from "@/features/problem/grades";
import { fetchProblemAnswer, useProblemDetail } from "@/features/problem/api";
import type { ProblemDetail } from "@/features/problem/schema";
import { progressActions, useProgress } from "@/features/storage/progress-store";
import { InfoPanel, type InfoTab } from "./info-panel";
import { KeywordBar } from "./keyword-bar";
import { ResultOverlay, type Overlay } from "./result-overlay";
import { DISPLAY_ROW_LIMIT, ResultTable } from "./result-table";

type MobileView = "info" | "editor" | "result";
type RightTab = "editor" | "result";
type Busy = null | "run" | "submit";

export function Workspace({ id }: { id: string }) {
  const detail = useProblemDetail(id);
  return (
    <LoadState value={detail} loadingLabel="問題を読み込んでいます…">
      {(problem) => <WorkspaceReady key={problem.id} problem={problem} />}
    </LoadState>
  );
}

function useEngineStatus(host: EngineHost) {
  return useSyncExternalStore(
    (l) => host.subscribe(l),
    () => host.status,
    () => "idle" as const,
  );
}

function WorkspaceReady({ problem }: { problem: ProblemDetail }) {
  const progress = useProgress();
  const host = getEngineHost(progress.dialect);
  const engineStatus = useEngineStatus(host);
  const editorRef = useRef<SqlEditorHandle>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const rightId = useTabsId("right");

  const [initialSql] = useState(() => progressActions.getDraft(problem.id));
  const [infoTab, setInfoTab] = useState<InfoTab>("statement");
  const [rightTab, setRightTab] = useState<RightTab>("editor");
  const [mobileView, setMobileView] = useState<MobileView>("info");
  const [busy, setBusy] = useState<Busy>(null);
  const [outcome, setOutcome] = useState<ExecutionOutcome | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [hintsOpened, setHintsOpened] = useState(0);
  const [split, setSplit] = useState(45);
  const [slowLoad, setSlowLoad] = useState(false);

  const status = progress.history[problem.id]?.status;
  const surrendered = status === "surrendered" || status === "solved_after_surrender";

  // 問題を開いたらエンジンの読み込みを始めておく
  useEffect(() => {
    host.load().catch(() => undefined);
  }, [host]);

  useEffect(() => {
    if (engineStatus !== "loading") return;
    const timer = setTimeout(() => setSlowLoad(true), 5000);
    return () => clearTimeout(timer);
  }, [engineStatus]);

  // 書きかけは離脱時にも保存する
  useEffect(() => {
    const flush = () => {
      clearTimeout(draftTimer.current);
      if (editorRef.current) progressActions.saveDraft(problem.id, editorRef.current.getValue());
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [problem.id]);

  const onEditorChange = useCallback(
    (value: string) => {
      clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => progressActions.saveDraft(problem.id, value), 1000);
    },
    [problem.id],
  );

  const showResult = () => {
    setRightTab("result");
    setMobileView("result");
  };

  const run = async () => {
    if (busy || !editorRef.current) return;
    setBusy("run");
    try {
      setOutcome(await runQuery(host, problem.dataset, editorRef.current.getValue()));
      showResult();
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (busy || !editorRef.current) return;
    const sql = editorRef.current.getValue();
    setBusy("submit");
    try {
      const answer = await fetchProblemAnswer(problem.id);
      const result = await submitQuery(host, problem.dataset, sql, answer);
      if (result.kind !== "judged") {
        setOutcome(result);
        showResult();
        return;
      }
      setOutcome({ kind: "result", result: result.result, elapsedMs: 0 });
      progressActions.saveDraft(problem.id, sql);
      const surrenderedBefore = status === "surrendered";
      const ascent = progressActions.submit(problem.id, problem.altitude, result.correct);
      setOverlay(
        result.correct
          ? { kind: "correct", ascent, answer, surrenderedBefore }
          : { kind: "incorrect" },
      );
    } catch (error) {
      setOutcome({
        kind: "sql_error",
        message:
          error instanceof Error
            ? `提出できませんでした: ${error.message}`
            : "提出できませんでした",
      });
      showResult();
    } finally {
      setBusy(null);
    }
  };

  const confirmSurrender = async () => {
    try {
      const answer = await fetchProblemAnswer(problem.id);
      progressActions.surrender(problem.id);
      setOverlay({ kind: "surrendered", answer });
    } catch {
      setOverlay(null);
    }
  };

  const closeOverlay = () => {
    setOverlay(null);
    setRightTab("editor");
    setMobileView("editor");
    requestAnimationFrame(() => editorRef.current?.focus());
  };

  const resetEditor = () => {
    editorRef.current?.setValue("");
    progressActions.saveDraft(problem.id, "");
    setOutcome(null);
    closeOverlay();
  };

  const tableNames = problem.dataset.tables.map((t) => t.name);

  return (
    <div
      className="workspace"
      data-mobile-view={mobileView}
      style={{ "--split": `${split}%` } as React.CSSProperties}
    >
      <div className="workspace__crumb">
        <Link href={`/problems/${problem.grade}`}>{GRADE_INFO[problem.grade].label}</Link>
        <span aria-hidden>/</span>
        <span>{problem.title}</span>
      </div>

      <div className="workspace__pane workspace__pane--info">
        <InfoPanel
          problem={problem}
          host={host}
          tab={infoTab}
          onTabChange={setInfoTab}
          hintsOpened={hintsOpened}
          onOpenHint={() => setHintsOpened((n) => Math.min(3, n + 1))}
          onSurrender={() => setOverlay({ kind: "confirm-surrender" })}
          surrendered={surrendered}
        />
      </div>

      <Splitter value={split} onChange={setSplit} />

      <div className="workspace__pane workspace__pane--work">
        <div className="work-bar">
          <TabList
            items={[
              { key: "editor", label: "エディタ" },
              { key: "result", label: "実行結果" },
            ]}
            value={rightTab}
            onChange={(k) => {
              setRightTab(k);
              setMobileView(k);
            }}
            label="エディタと実行結果"
            idPrefix={rightId}
            className="work-bar__tabs"
          />
          <EngineBadge
            status={engineStatus}
            dialect={DIALECT_LABEL[progress.dialect]}
            slow={slowLoad}
          />
          <div className="work-bar__actions">
            <DotButton
              onClick={run}
              status={busy === "run" ? "busy" : "idle"}
              disabled={busy !== null}
              title="実行（Ctrl + Enter）"
            >
              実行
            </DotButton>
            <DotButton
              variant="primary"
              onClick={submit}
              status={busy === "submit" ? "busy" : "idle"}
              disabled={busy !== null}
              title="提出（Ctrl + Shift + Enter）"
            >
              提出
            </DotButton>
          </div>
        </div>

        <TabPanel
          idPrefix={rightId}
          tabKey="editor"
          active={rightTab === "editor"}
          keepMounted
          className="work-panel work-panel--editor"
        >
          <SqlEditor
            ref={editorRef}
            initialValue={initialSql}
            dialect={progress.dialect}
            tables={problem.dataset.tables}
            onChange={onEditorChange}
            onRun={run}
            onSubmit={submit}
            label={`${problem.title} の回答 SQL`}
          />
          <KeywordBar tables={tableNames} onInsert={(text) => editorRef.current?.insert(text)} />
        </TabPanel>

        <TabPanel
          idPrefix={rightId}
          tabKey="result"
          active={rightTab === "result"}
          keepMounted
          className="work-panel work-panel--result"
        >
          <OutcomeView outcome={outcome} busy={busy} />
        </TabPanel>
      </div>

      <nav className="mobile-bar" aria-label="表示の切り替え">
        {(
          [
            ["info", "問題"],
            ["editor", "エディタ"],
            ["result", "結果"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="mobile-bar__item"
            aria-pressed={mobileView === key}
            onClick={() => {
              setMobileView(key);
              if (key !== "info") setRightTab(key);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {overlay && (
        <ResultOverlay
          overlay={overlay}
          problem={problem}
          onClose={closeOverlay}
          onRetryKeep={closeOverlay}
          onRetryReset={resetEditor}
          onRequestSurrender={() => setOverlay({ kind: "confirm-surrender" })}
          onConfirmSurrender={confirmSurrender}
        />
      )}
    </div>
  );
}

function EngineBadge({
  status,
  dialect,
  slow,
}: {
  status: string;
  dialect: string;
  slow: boolean;
}) {
  if (status === "ready" || status === "idle") {
    return (
      <span className="engine-badge" data-status={status}>
        {dialect}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="engine-badge" data-status="error" role="alert">
        {dialect} を読み込めませんでした（再読み込みしてください）
      </span>
    );
  }
  return (
    <span className="engine-badge" data-status="loading" role="status">
      <span className="load-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      {dialect} 登山準備中{slow ? "（初回は少し時間がかかります）" : ""}
    </span>
  );
}

function OutcomeView({ outcome, busy }: { outcome: ExecutionOutcome | null; busy: Busy }) {
  if (busy) {
    return (
      <p className="load-state" role="status">
        <span className="load-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        {busy === "run" ? "実行しています…" : "判定しています…"}
      </p>
    );
  }
  if (!outcome) {
    return (
      <p className="muted result-placeholder">
        「実行」を押すと、ここに結果が表示されます。提出前の確かめに使ってください。
      </p>
    );
  }
  if (outcome.kind === "result") {
    const total = outcome.result.rows.length;
    return (
      <div className="outcome">
        <p className="outcome__meta muted">
          {total.toLocaleString("ja-JP")} 行
          {total > DISPLAY_ROW_LIMIT && `（先頭 ${DISPLAY_ROW_LIMIT} 行を表示）`}
          {outcome.elapsedMs > 0 && ` ・ ${outcome.elapsedMs} ms`}
        </p>
        <ResultTable result={outcome.result} caption="実行結果" />
      </div>
    );
  }
  const heading =
    outcome.kind === "sql_error"
      ? "SQL エラー"
      : outcome.kind === "timeout"
        ? "時間切れ"
        : "実行できません";
  return (
    <div className="outcome outcome--error" role="alert">
      <p className="outcome__error-title">{heading}</p>
      <pre className="outcome__error">{outcome.message}</pre>
      {outcome.kind === "sql_error" && <p className="muted">{explainError(outcome.message)}</p>}
    </div>
  );
}

/** よくあるエラーに、初学者向けの一言を添える */
function explainError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("no such table") || (m.includes("relation") && m.includes("does not exist")))
    return "テーブル名を確かめてください。「テーブル情報」タブで正しい名前が見られます。";
  if (m.includes("no such column") || (m.includes("column") && m.includes("does not exist")))
    return "カラム名を確かめてください。JOIN しているときは、どのテーブルのカラムかを「テーブル名.カラム名」で書くと確実です。";
  if (m.includes("syntax error"))
    return "書き方に誤りがあります。カンマの付け忘れや付けすぎ、キーワードの綴り、かっこの対応を見直してください。";
  if (m.includes("ambiguous"))
    return "同じ名前のカラムが複数のテーブルにあります。「テーブル名.カラム名」の形で書いてください。";
  if (m.includes("group by") || m.includes("aggregate"))
    return "集計関数と一緒に選ぶ列は、GROUP BY に書いた列である必要があります。";
  return "メッセージの内容を手がかりに、該当する箇所を見直してください。";
}

/** 左右ペインの境界。ドラッグと左右キーで幅を変えられる */
function Splitter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(70, Math.max(25, v));
  return (
    <div
      className="splitter"
      role="separator"
      aria-orientation="vertical"
      aria-label="左右の幅を調整"
      aria-valuemin={25}
      aria-valuemax={70}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onChange(clamp(value - 2));
        if (e.key === "ArrowRight") onChange(clamp(value + 2));
      }}
      onPointerDown={(e) => {
        const container = e.currentTarget.parentElement!;
        const rect = container.getBoundingClientRect();
        e.currentTarget.setPointerCapture(e.pointerId);
        const move = (ev: PointerEvent) =>
          onChange(clamp(((ev.clientX - rect.left) / rect.width) * 100));
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
    />
  );
}
