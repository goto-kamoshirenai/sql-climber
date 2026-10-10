import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__note">
          学習記録はこのブラウザの中にだけ保存されます。サーバーには送信しません。
        </p>
        <nav aria-label="フッター">
          <Link href="/about">注意事項</Link>
          <Link href="/resources">学習リソース</Link>
          <a
            href="https://github.com/goto-kamoshirenai/sql-climber/issues"
            rel="noopener"
            target="_blank"
          >
            誤りの報告
          </a>
        </nav>
      </div>
    </footer>
  );
}
