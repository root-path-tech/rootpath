import type { Metadata } from "next";

import { MissingPath } from "@/components/sections/missing-path";
import { LogoMark } from "@/components/ui/logo";
import { sectionLinks } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** A route across the contours that stops short: drawn on load in CSS, so it plays before hydration. */
function DeadEnd() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      fill="none"
    >
      <path
        className="route-draw-in"
        pathLength={1}
        d="M1490 960 L1490 678 Q1490 660 1472 660 L1268 660 Q1250 660 1250 642 L1250 414"
        strokeWidth={1.5}
        strokeLinecap="round"
        style={{ stroke: "var(--accent)", opacity: 0.75 }}
      />
      {[
        [1490, 780, "0.9s"],
        [1370, 660, "1.3s"],
      ].map(([cx, cy, delay]) => (
        <circle
          key={`${cx}-${cy}`}
          className="route-node-in"
          cx={cx}
          cy={cy}
          r={4}
          strokeWidth={1.5}
          style={
            {
              fill: "var(--background)",
              stroke: "var(--accent)",
              "--node-delay": delay,
            } as React.CSSProperties
          }
        />
      ))}
      <g
        className="route-node-in"
        style={{ "--node-delay": "2s" } as React.CSSProperties}
        strokeWidth={1.75}
        strokeLinecap="round"
      >
        <path d="M1240 394 L1260 414 M1260 394 L1240 414" stroke="#a3564f" />
        <circle
          cx={1250}
          cy={404}
          r={20}
          strokeWidth={1}
          style={{ stroke: "#a3564f", opacity: 0.4 }}
        />
      </g>
    </svg>
  );
}

export default function NotFound() {
  return (
    <main
      data-surface="inverse"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-background text-foreground"
    >
      <div
        aria-hidden="true"
        className="not-found-contours contour-field pointer-events-none absolute inset-0 opacity-[0.16]"
      />
      <DeadEnd />

      <header className="relative mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10">
        <a
          href="/"
          aria-label="Root-Path home"
          className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <LogoMark className="text-lg leading-none" />
        </a>
      </header>

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-20 lg:px-10">
        <p className="eyebrow">404 · Not found</p>
        <h1 className="mt-6 max-w-3xl text-[clamp(2.75rem,6vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.035em] text-foreground">
          This path doesn&rsquo;t lead anywhere.
        </h1>
        <MissingPath />
        <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          The page may have moved, or the link may be mistyped.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-6">
          <a
            href="/"
            className="group inline-flex h-12 items-center gap-2 rounded-lg border border-accent bg-accent px-6 text-sm font-medium text-accent-foreground outline-none transition-colors duration-300 hover:bg-accent-strong focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to the start
            <span
              aria-hidden="true"
              className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1"
            >
              →
            </span>
          </a>
          <nav aria-label="Site sections">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px]">
              {sectionLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={`/${link.href}`}
                    className="rounded text-muted-foreground outline-none transition-colors duration-300 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}
