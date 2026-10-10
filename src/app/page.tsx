import { GradeCards } from "@/components/grade-cards";

export default function HomePage() {
  return (
    <div className="page home">
      <section className="home-hero">
        <p className="home-hero__eyebrow dot-num">SQL CLIMBER</p>
        <h1 className="home-hero__title">SQL を、一歩ずつ登る。</h1>
        <p className="home-hero__lead">
          ブラウザの中で SQL を書いて、実行して、答え合わせをする問題集です。
          <br />
          ふもとの SELECT から、富士山頂のウィンドウ関数まで。登るほど登山家ランクが上がります。
        </p>
      </section>

      <section aria-labelledby="grades-title">
        <h2 id="grades-title" className="section-title">
          登る山を選ぶ
        </h2>
        <GradeCards />
      </section>
    </div>
  );
}
