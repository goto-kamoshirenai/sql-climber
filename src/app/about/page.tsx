import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "注意事項" };

export default function AboutPage() {
  return (
    <div className="page about">
      <h1 className="page-title">注意事項</h1>
      <p className="page-lead">登りはじめる前に、一度だけ目を通してください。</p>

      <section className="section" aria-labelledby="about-data">
        <h2 id="about-data" className="section-title">
          あなたのデータについて
        </h2>
        <ul>
          <li>このサイトはデータベースを持ちません。会員登録もありません。</li>
          <li>
            書いた SQL は、あなたのブラウザの中にあるデータベース（SQLite または PostgreSQL を
            WebAssembly で動かしたもの）で実行し、答え合わせもブラウザの中で行います。SQL
            がサーバーへ送られることはありません。
          </li>
          <li>
            登山家ランクや山行の記録、書きかけの SQL
            は、ブラウザの保存領域（localStorage）にだけ保存されます。サーバーには送信も保存もしません。
          </li>
          <li>
            そのため、ブラウザのデータを消したり、別のブラウザや端末を使ったりすると記録は引き継がれません。必要なら
            <Link href="/mypage">登山手帳</Link>から記録を書き出しておいてください。
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="about-accuracy">
        <h2 id="about-accuracy" className="section-title">
          内容の正確さについて
        </h2>
        <ul>
          <li>
            制作者は SQL
            の専門家ではありません。問題文や解説には、不正確な表現や誤りが含まれているかもしれません。
          </li>
          <li>
            問題とデータは、既存の学習サイトなどを参考にしながら AI
            の助けを借りて作り、動作を確かめています。
          </li>
          <li>
            山や山小屋のデータは学習用に作ったものです。標高は実在の山を参考にしていますが、ルートの距離や山小屋の名前・料金などは架空です。登山の計画には使わないでください。
          </li>
          <li>
            誤りを見つけたら、
            <a
              href="https://github.com/goto-kamoshirenai/sql-climber/issues"
              target="_blank"
              rel="noopener"
            >
              GitHub の Issues
            </a>
            で教えていただけると助かります。
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="about-dialect">
        <h2 id="about-dialect" className="section-title">
          SQLite と PostgreSQL について
        </h2>
        <ul>
          <li>
            問題はどちらの種類でも同じ答えになるように作っています。画面上部でいつでも切り替えられます。
          </li>
          <li>
            データベースによって、エラーメッセージや、小数の表示（例: PostgreSQL では平均が{" "}
            <code>41.0833…</code>{" "}
            のように長く表示される）が異なります。答え合わせではこうした表記の違いを同じ値として扱います。
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="about-judge">
        <h2 id="about-judge" className="section-title">
          答え合わせのしくみ
        </h2>
        <ul>
          <li>提出すると、あなたの SQL と模範解答を同じデータで実行し、結果の表を比べます。</li>
          <li>列の名前（AS で付ける別名）は問いません。列の数と順番、行の中身は比べます。</li>
          <li>行の並び順は、問題文で並び順を指定している問題だけ比べます。</li>
        </ul>
      </section>

      <section className="section" aria-labelledby="about-ads">
        <h2 id="about-ads" className="section-title">
          広告について
        </h2>
        <p>
          <Link href="/resources">学習リソース</Link>
          のページには、今後アフィリエイトリンクを掲載することがあります。掲載する場合は、そのリンクに「広告」と明記します。
        </p>
      </section>

      <section className="section" aria-labelledby="about-credits">
        <h2 id="about-credits" className="section-title">
          使っているもの
        </h2>
        <p className="muted">
          Next.js / dotterel-ui / CodeMirror / sql.js / PGlite /
          beautiful-mermaid。それぞれの作者とコミュニティに感謝します。
        </p>
      </section>
    </div>
  );
}
