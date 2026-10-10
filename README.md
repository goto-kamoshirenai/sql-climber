# SQL Climber

SQL 初学者のための問題集サイトです。ブラウザの中で SQL を書いて、実行して、答え合わせをします。
ふもとの SELECT から富士山頂（3776m）のウィンドウ関数まで、問題を解くほど「登山家ランク」が上がります。

- **データベースを持ちません。** SQL の実行と判定は、ブラウザ内の SQLite（[sql.js](https://github.com/sql-js/sql.js)）または PostgreSQL（[PGlite](https://github.com/electric-sql/pglite)）で行います。
- **ユーザーの情報をサーバーに送りません。** 学習記録は localStorage にだけ保存し、JSON で書き出し・読み込みができます。
- SQLite と PostgreSQL はいつでも切り替えられます。問題は共通です。

## 開発

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

`pnpm dev` / `pnpm build` の前に `scripts/prepare-assets.mts` が走り、SQL エンジンの wasm を `public/wasm/` に、E-R 図の SVG を `public/er/` に生成します（どちらも生成物なので git 管理外）。

| コマンド | 内容 |
| --- | --- |
| `pnpm check` | lint・型検査・ユニットテスト・コンテンツ検証をまとめて実行 |
| `pnpm test` | ユニットテスト（Vitest） |
| `pnpm validate:content [ID...]` | 問題とデータセットの検証。模範解答を両エンジンで実行し、結果の一致まで確かめる |
| `pnpm e2e` | E2E テスト（Playwright。本番ビルドを起動して実行） |

## 問題の追加

1. `content/problems/<4桁のID>.json` を追加する（形は `src/features/problem/schema.ts` の `problemSourceSchema`）
2. `pnpm validate:content <ID>` が通るまで直す
3. デプロイすると反映される（コードの変更は不要）

問題・データ・模範解答は、SQLite と PostgreSQL の両方で同じ結果になる SQL だけで書きます（日付は `'YYYY-MM-DD'` の文字列、`BOOLEAN` は使わず `0/1`、など）。検証スクリプトが両エンジンで実行して食い違いを検出します。

## 構成

```
content/            問題・データセット・学習リソース（API route がビルド時に読み、静的に配信）
scripts/            アセット生成・コンテンツ検証
src/app/            ページと API route（すべて静的生成）
src/features/
  engine/           Engine 抽象・sql.js / PGlite アダプタ・Web Worker（5 秒でタイムアウト）
  judge/            結果セットの比較（行順・列名は不問、列順・値は比較）
  rank/             登山家ランクの計算と称号
  storage/          学習記録（localStorage）
  editor/           CodeMirror 6 の SQL エディタ
  workspace/        回答画面
e2e/                Playwright
```

## データについて

問題文・データは学習用に作成したものです。標高は実在の山を参考にしていますが、ルートの距離や山小屋の名称・料金などは架空です。
