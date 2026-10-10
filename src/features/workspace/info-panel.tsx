"use client";

import { DotButton } from "dotterel-ui/button";
import { useEffect, useState, type MouseEvent } from "react";
import { TabList, TabPanel, useTabsId } from "@/components/tabs";
import type { EngineHost } from "@/features/engine/engine-host";
import type { QueryResult } from "@/features/engine/types";
import type { ProblemDetail, ResolvedDataset } from "@/features/problem/schema";
import { ResultTable } from "./result-table";

export type InfoTab = "statement" | "tables" | "er" | "samples" | "hints";

const SAMPLE_LIMIT = 50;

export function InfoPanel({
  problem,
  host,
  tab,
  onTabChange,
  hintsOpened,
  onOpenHint,
  onSurrender,
  surrendered,
}: {
  problem: ProblemDetail;
  host: EngineHost;
  tab: InfoTab;
  onTabChange: (tab: InfoTab) => void;
  hintsOpened: number;
  onOpenHint: () => void;
  onSurrender: () => void;
  surrendered: boolean;
}) {
  const id = useTabsId("info");
  const items: { key: InfoTab; label: string }[] = [
    { key: "statement", label: "問題文" },
    { key: "tables", label: "テーブル情報" },
    ...(problem.dataset.erSvg ? [{ key: "er" as const, label: "E-R図" }] : []),
    { key: "samples", label: "サンプルデータ" },
    { key: "hints", label: hintsOpened > 0 ? `ヒント ${hintsOpened}/3` : "ヒント" },
  ];

  return (
    <section className="info-panel" aria-label="問題の情報">
      <TabList
        items={items}
        value={tab}
        onChange={onTabChange}
        label="問題の情報"
        idPrefix={id}
        className="tabs--scroll"
      />
      <div className="info-panel__body">
        <TabPanel idPrefix={id} tabKey="statement" active={tab === "statement"}>
          <div className="statement">
            <p className="statement__meta">
              <span className="num statement__alt">
                {problem.altitude.toLocaleString("ja-JP")}m
              </span>
              <span className="muted">{problem.dataset.name}</span>
            </p>
            <h1 className="statement__title">{problem.title}</h1>
            <div
              className="prose"
              onClick={handleCopyClick}
              dangerouslySetInnerHTML={{ __html: problem.statementHtml }}
            />
          </div>
        </TabPanel>
        <TabPanel idPrefix={id} tabKey="tables" active={tab === "tables"}>
          <TablesInfo dataset={problem.dataset} />
        </TabPanel>
        {problem.dataset.erSvg && (
          <TabPanel idPrefix={id} tabKey="er" active={tab === "er"}>
            <ErDiagram svg={problem.dataset.erSvg} name={problem.dataset.name} />
          </TabPanel>
        )}
        <TabPanel idPrefix={id} tabKey="samples" active={tab === "samples"}>
          <SampleData dataset={problem.dataset} host={host} />
        </TabPanel>
        <TabPanel idPrefix={id} tabKey="hints" active={tab === "hints"}>
          <Hints
            hints={problem.hintsHtml}
            opened={hintsOpened}
            onOpen={onOpenHint}
            onSurrender={onSurrender}
            surrendered={surrendered}
          />
        </TabPanel>
      </div>
    </section>
  );
}

/** 問題文のコピーボタン（HTML はサーバーで生成。src/server/content.ts の statementMd） */
function handleCopyClick(event: MouseEvent<HTMLDivElement>) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".copy-button");
  if (!button) return;
  const text = button.dataset.copy ?? "";
  copyText(text).then(
    () => {
      button.dataset.copied = "true";
      button.setAttribute("aria-label", `${text} をコピーしました`);
      window.setTimeout(() => {
        delete button.dataset.copied;
        button.setAttribute("aria-label", `${text} をコピー`);
      }, 1500);
    },
    () => {},
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard API が使えない環境（非 HTTPS など）向け
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("copy failed");
  }
}

function TablesInfo({ dataset }: { dataset: ResolvedDataset }) {
  return (
    <div className="tables-info">
      <p className="muted tables-info__lead">{dataset.description}</p>
      {dataset.tables.map((table) => (
        <section key={table.name} className="table-card">
          <h2 className="table-card__name">
            <code>{table.name}</code>
            <span className="muted">{table.description}</span>
          </h2>
          <table className="table-card__columns">
            <thead>
              <tr>
                <th scope="col">カラム</th>
                <th scope="col">型</th>
                <th scope="col">説明</th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map((column) => {
                const fk = table.foreignKeys.find((f) => f.column === column.name);
                return (
                  <tr key={column.name}>
                    <td>
                      <code>{column.name}</code>
                      {column.pk && <span className="key-badge">PK</span>}
                      {fk && <span className="key-badge key-badge--fk">FK</span>}
                    </td>
                    <td>
                      <code className="muted">{column.type}</code>
                    </td>
                    <td>
                      {column.description}
                      {fk && (
                        <span className="muted">
                          {" "}
                          →{" "}
                          <code>
                            {fk.references.table}.{fk.references.column}
                          </code>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

function ErDiagram({ svg, name }: { svg: { light: string; dark: string }; name: string }) {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="er">
      <div className="er__tools">
        <span className="muted">線は「1つの行 ── 0個以上の行」の関係を表します</span>
        <div className="er__zoom">
          <button
            type="button"
            className="icon-button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            aria-label="縮小"
          >
            −
          </button>
          <span className="num" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
            aria-label="拡大"
          >
            +
          </button>
        </div>
      </div>
      <div className="er__canvas">
        {/* eslint-disable-next-line @next/next/no-img-element -- ビルド時生成の SVG をそのまま表示する */}
        <img
          src={svg.light}
          alt={`${name} の E-R 図`}
          className="er__img er__img--light"
          style={{ width: `${zoom * 100}%` }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={svg.dark}
          alt={`${name} の E-R 図`}
          className="er__img er__img--dark"
          style={{ width: `${zoom * 100}%` }}
        />
      </div>
    </div>
  );
}

type Samples = { table: string; total: number; result: QueryResult }[];

function SampleData({ dataset, host }: { dataset: ResolvedDataset; host: EngineHost }) {
  const [samples, setSamples] = useState<{ key: string; value: Samples | Error } | null>(null);
  const key = `${host.dialect}:${dataset.id}`;

  useEffect(() => {
    let alive = true;
    const queries = dataset.tables.flatMap((t) => [
      `SELECT * FROM ${t.name} LIMIT ${SAMPLE_LIMIT}`,
      `SELECT COUNT(*) FROM ${t.name}`,
    ]);
    host
      .batch(dataset.ddl, dataset.data, queries)
      .then((items) => {
        const value: Samples = dataset.tables.map((t, i) => {
          const rows = items[i * 2];
          const count = items[i * 2 + 1];
          if (!rows?.ok || !count?.ok) throw new Error("サンプルデータを取得できませんでした");
          return {
            table: t.name,
            total: Number(count.result.rows[0]?.[0] ?? 0),
            result: rows.result,
          };
        });
        if (alive) setSamples({ key, value });
      })
      .catch((error: Error) => alive && setSamples({ key, value: error }));
    return () => {
      alive = false;
    };
  }, [dataset, host, key]);

  const current = samples?.key === key ? samples.value : null;
  if (!current) return <p className="load-state muted">サンプルデータを読み込んでいます…</p>;
  if (current instanceof Error)
    return <p className="load-state load-state--error">{current.message}</p>;

  return (
    <div className="samples">
      {current.map((s) => (
        <section key={s.table} className="samples__table">
          <h2 className="samples__name">
            <code>{s.table}</code>
            <span className="muted">
              全 {s.total} 行{s.total > SAMPLE_LIMIT ? `（先頭 ${SAMPLE_LIMIT} 行を表示）` : ""}
            </span>
          </h2>
          <ResultTable result={s.result} caption={`${s.table} のサンプルデータ`} />
        </section>
      ))}
    </div>
  );
}

const HINT_LABELS = ["考え方", "使う構文", "クエリの骨格"];

function Hints({
  hints,
  opened,
  onOpen,
  onSurrender,
  surrendered,
}: {
  hints: [string, string, string];
  opened: number;
  onOpen: () => void;
  onSurrender: () => void;
  surrendered: boolean;
}) {
  return (
    <div className="hints">
      <p className="muted hints__lead">
        ヒントは何度見ても獲得標高は減りません。行き詰まったら、ひとつずつ開いてください。
      </p>
      <ol className="hints__list">
        {hints.map((html, i) => (
          <li key={i} className="hint" data-open={i < opened || undefined}>
            <h2 className="hint__label">
              <span className="dot-num">HINT {i + 1}</span> {HINT_LABELS[i]}
            </h2>
            {i < opened ? (
              <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            ) : i === opened ? (
              <DotButton onClick={onOpen}>ヒント{i + 1}を開く</DotButton>
            ) : (
              <p className="muted hint__locked">前のヒントを開くと見られます</p>
            )}
          </li>
        ))}
      </ol>
      {opened >= 3 && !surrendered && (
        <div className="hints__surrender">
          <p className="muted">それでも道が見えないときは、降参して解説を読むこともできます。</p>
          <DotButton variant="quiet" onClick={onSurrender}>
            降参して解説を見る
          </DotButton>
        </div>
      )}
    </div>
  );
}
