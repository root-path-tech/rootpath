"use client";

import * as React from "react";

import { routePath, type Point } from "@/components/sections/services/diagram";

/** Height of the drawing above the band's top edge, in px. */
const RISE = 44;

/**
 * A route along the bottom of the first screen that turns down into the Services band peeking
 * up from below, so the path reads as running on into the page. Drawn in CSS once the intro has
 * played (`--intro`), so it needs no scroll and plays before hydration finishes.
 */
export function HeroRoute({ peek }: { peek: number }) {
  const ref = React.useRef<SVGSVGElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const update = () => setWidth(svg.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const centre = Math.round(width / 2);
  const points: Point[] = [
    [-24, 8],
    [centre, 8],
    [centre, RISE + 24],
  ];
  const stops = [0.24, 0.4].map((share) => Math.round(width * share));
  const run = centre + 24;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 h-[68px] w-full overflow-visible"
      style={{ bottom: `${peek}svh` }}
      viewBox={`0 0 ${width || 1} 68`}
      preserveAspectRatio="none"
      fill="none"
    >
      {width ? (
        <>
          <path
            className="route-draw-in"
            data-route-line=""
            pathLength={1}
            d={routePath(points, 16)}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              {
                stroke: "var(--accent)",
                opacity: 0.55,
                "--route-delay": "calc(var(--intro) + 1.1s)",
              } as React.CSSProperties
            }
          />
          {stops.map((x) => (
            <circle
              key={x}
              className="route-node-in"
              data-route-node=""
              cx={x}
              cy={8}
              r={4}
              strokeWidth={1.5}
              style={
                {
                  fill: "var(--background)",
                  stroke: "var(--accent)",
                  // The line reaches each stop at this share of its 1.8s draw.
                  "--node-delay": `calc(var(--intro) + ${(1.1 + ((x + 24) / (run + RISE + 16)) * 1.8).toFixed(2)}s)`,
                } as React.CSSProperties
              }
            />
          ))}
        </>
      ) : null}
    </svg>
  );
}
