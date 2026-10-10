import Link from "next/link";
import { MountainArt } from "@/components/dot-art";

export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: "center" }}>
      <div style={{ maxWidth: 240, margin: "24px auto" }}>
        <MountainArt level={1} />
      </div>
      <h1 className="page-title">道に迷ったようです</h1>
      <p className="page-lead">お探しのページは見つかりませんでした。</p>
      <Link href="/">登山口に戻る</Link>
    </div>
  );
}
