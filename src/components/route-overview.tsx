"use client";

import { useClimb } from "@/features/achievements/use-climb";
import { RouteMap } from "./route-map";

/** ホームの「ルート全体図」節 */
export function RouteOverview() {
  const climb = useClimb();
  return (
    <section aria-labelledby="route-title" className="home-route">
      <div className="home-route__head">
        <h2 id="route-title" className="section-title">
          ルート全体図
        </h2>
        <p className="home-route__legend">
          <span className="legend legend--solved">登頂</span>
          <span className="legend">未踏</span>
          <span className="legend legend--current">現在地</span>
        </p>
      </div>
      <RouteMap climb={climb} />
    </section>
  );
}
