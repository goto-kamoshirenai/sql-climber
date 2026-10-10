import type { Metadata } from "next";
import { MyPage } from "@/components/my-page";

export const metadata: Metadata = { title: "登山手帳" };

export default function MyPageRoute() {
  return (
    <div className="page">
      <h1 className="page-title">登山手帳</h1>
      <p className="page-lead">
        あなたの登山家ランクと、これまでの山行の記録です。記録はこのブラウザの中にだけ保存されています。
      </p>
      <MyPage />
    </div>
  );
}
