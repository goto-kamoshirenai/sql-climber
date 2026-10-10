"use client";

import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { PostgreSQL, SQLite, sql } from "@codemirror/lang-sql";
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Dialect } from "@/features/engine/types";
import type { TableMeta } from "@/features/problem/schema";

export type SqlEditorHandle = {
  getValue(): string;
  setValue(value: string): void;
  /** カーソル位置に挿入（前後の空白を補う） */
  insert(text: string): void;
  focus(): void;
};

type Props = {
  initialValue: string;
  dialect: Dialect;
  tables: TableMeta[];
  onChange: (value: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  label: string;
};

/** 色はすべてテーマの CSS 変数から取る（ライト/ダーク切替で再生成しない） */
const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "var(--code-bg)",
    color: "var(--text)",
  },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
  ".cm-content": { padding: "12px 0", caretColor: "var(--accent)" },
  ".cm-gutters": {
    backgroundColor: "var(--code-bg)",
    color: "var(--text-muted)",
    border: "none",
    borderRight: "1px solid var(--line)",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in srgb, var(--accent) 25%, transparent) !important",
  },
  ".cm-matchingBracket": {
    backgroundColor: "var(--accent-soft)",
    outline: "1px solid var(--accent)",
  },
  ".cm-placeholder": { color: "var(--text-muted)" },
  ".cm-tooltip": {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--line-strong)",
    borderRadius: "6px",
    overflow: "hidden",
  },
  ".cm-tooltip-autocomplete > ul > li": { padding: "2px 10px", fontFamily: "var(--font-mono)" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--on-accent)",
  },
  ".cm-completionDetail": {
    color: "inherit",
    opacity: 0.7,
    fontStyle: "normal",
    marginLeft: "8px",
  },
});

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: "var(--accent)", fontWeight: "600" },
  { tag: [t.string, t.special(t.string)], color: "var(--syntax-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--syntax-number)" },
  {
    tag: [t.comment, t.lineComment, t.blockComment],
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  { tag: [t.operator, t.punctuation], color: "var(--text-muted)" },
  { tag: [t.typeName, t.standard(t.name)], color: "var(--syntax-type)" },
]);

function languageFor(dialect: Dialect, tables: TableMeta[]) {
  const schema = Object.fromEntries(
    tables.map((table) => [
      table.name,
      table.columns.map((c) => ({
        label: c.name,
        type: "property",
        detail: `${c.type} ${c.description}`,
      })),
    ]),
  );
  return sql({
    dialect: dialect === "postgres" ? PostgreSQL : SQLite,
    schema,
    upperCaseKeywords: true,
  });
}

export const SqlEditor = forwardRef<SqlEditorHandle, Props>(function SqlEditor(
  { initialValue, dialect, tables, onChange, onRun, onSubmit, label },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageConf = useRef(new Compartment());
  // コールバックは最新のものを参照する（エディタを作り直さない）
  const callbacks = useRef({ onChange, onRun, onSubmit });
  useEffect(() => {
    callbacks.current = { onChange, onRun, onSubmit };
  });

  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion({ icons: false }),
          syntaxHighlighting(highlight),
          languageConf.current.of(languageFor(dialect, tables)),
          placeholder("ここに SQL を書きます（Ctrl + Enter で実行）"),
          Prec.highest(
            keymap.of([
              { key: "Mod-Enter", run: () => (callbacks.current.onRun(), true) },
              { key: "Mod-Shift-Enter", run: () => (callbacks.current.onSubmit(), true) },
            ]),
          ),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...completionKeymap,
            indentWithTab,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
          }),
          EditorView.contentAttributes.of({
            "aria-label": label,
            spellcheck: "false",
            autocapitalize: "off",
            autocorrect: "off",
          }),
          editorTheme,
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // エディタは1回だけ作る。方言・スキーマの変更は下の effect で差し替える
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageConf.current.reconfigure(languageFor(dialect, tables)),
    });
  }, [dialect, tables]);

  useImperativeHandle(ref, () => ({
    getValue: () => viewRef.current?.state.doc.toString() ?? "",
    setValue(value) {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    },
    insert(text) {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const before = view.state.sliceDoc(Math.max(0, from - 1), from);
      const after = view.state.sliceDoc(to, to + 1);
      // クォートは対で入れて、カーソルを内側に置く
      const isQuote = text === "'";
      const insert = isQuote ? `${spaced("", before, "x")}''` : spaced(text, before, after);
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + insert.length - (isQuote ? 1 : 0) },
        scrollIntoView: true,
      });
      view.focus();
    },
    focus: () => viewRef.current?.focus(),
  }));

  return <div ref={hostRef} className="sql-editor" />;
});

/** 入力補助バーから挿入するときに、前後の空白を自然に補う */
export function spaced(text: string, before: string, after: string): string {
  const tight = text === ")" || text === "," || text === ";" || text === "." || text === "(";
  const opensParen = text.endsWith("(");
  const needsLeading = !tight && before !== "" && !/[\s(.]/.test(before);
  const needsTrailing = text !== "" && !opensParen && text !== "." && !/^\s/.test(after);
  return `${needsLeading ? " " : ""}${text}${needsTrailing ? " " : ""}`;
}
