import { ConsoleHero } from "@/components/console-hero";
import { GradeCards } from "@/components/grade-cards";
import { RouteOverview } from "@/components/route-overview";

export default function HomePage() {
  return (
    <div className="page page--wide home">
      <ConsoleHero />

      <RouteOverview />

      <section aria-labelledby="grades-title" className="home-grades">
        <h2 id="grades-title" className="section-title">
          登る山を選ぶ
        </h2>
        <GradeCards />
      </section>
    </div>
  );
}
