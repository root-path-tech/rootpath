"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { GrowBand, GrowIn } from "@/components/motion/grow";
import { Magnetic } from "@/components/motion/magnetic";
import { Terrain } from "@/components/motion/terrain";
import {
  resetPointerLight,
  trackPointerLight,
} from "@/components/motion/pointer-light";
import {
  useMediaQuery,
  usePrefersReducedMotion,
} from "@/components/motion/use-media-query";
import {
  stages,
  type Artifact,
  type Stage,
} from "@/components/sections/process/data";
import { Button } from "@/components/ui/button";
import { goToContact } from "@/lib/contact";
import { clamp01 } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Horizontal geometry of the path, measured from layout (transforms do not affect it). */
interface PathLayout {
  /** How far the row travels sideways, in px. */
  distance: number;
  viewport: number;
  /** Left edge of each panel in the row: intro, the stages, then the closing panel. */
  lefts: number[];
}

/** Where "now" sits on the path, as a share of the viewport width from its left edge. */
const NOW = 0.6;
/** Vertical scroll spent per pixel of sideways travel. */
const PACE = 1.15;
/** The track runs above the cards; each stage branches down into its card. */
const TRACK_Y = 16;
const CARD_TOP = 56;
/** Horizontal offset of a stage's node from its card's left edge. */
const NODE_X = 34;

export function Process() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const shouldReduceMotion = usePrefersReducedMotion();
  const horizontal = isDesktop && !shouldReduceMotion;

  const trackRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const panelRefs = React.useRef<(HTMLElement | null)[]>([]);

  const layout = useMotionValue<PathLayout>({
    distance: 0,
    viewport: 1,
    lefts: [],
  });
  const [distance, setDistance] = React.useState(0);
  const [route, setRoute] = React.useState({ left: 0, width: 0 });
  const [nodes, setNodes] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!horizontal) return;
    const measure = () => {
      const row = rowRef.current;
      const viewport = viewportRef.current;
      if (!row || !viewport) return;
      const lefts = panelRefs.current.map((panel) => panel?.offsetLeft ?? 0);
      const next = {
        distance: Math.max(0, row.scrollWidth - viewport.clientWidth),
        viewport: viewport.clientWidth,
        lefts,
      };
      layout.set(next);
      setDistance(next.distance);
      // One node per stage plus one for the closing panel; the track joins them.
      const nodeXs = lefts.slice(1).map((left) => left + NODE_X);
      setNodes(nodeXs);
      const start = nodeXs[0] ?? 0;
      const end = nodeXs[nodeXs.length - 1] ?? start;
      setRoute({ left: start, width: Math.max(0, end - start) });
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (rowRef.current) observer.observe(rowRef.current);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [horizontal, layout]);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(() => -scrollYProgress.get() * layout.get().distance);
  // Row coordinate of "now": everything left of it has been reached.
  const head = useTransform(() => {
    const geometry = layout.get();
    return scrollYProgress.get() * geometry.distance + geometry.viewport * NOW;
  });
  const routeFill = useTransform(() =>
    route.width ? clamp01((head.get() - route.left) / route.width) : 0,
  );

  const setPanel = (index: number) => (element: HTMLElement | null) => {
    panelRefs.current[index] = element;
  };

  return (
    <GrowBand>
      <section
        id="process"
        aria-labelledby="process-heading"
        // Pinned on desktop: land at the top of the track so the path starts in place.
        style={horizontal ? { scrollMarginTop: "-6rem" } : undefined}
      >
        <div
          ref={trackRef}
          style={
            horizontal
              ? { height: `calc(100svh + ${Math.round(distance * PACE)}px)` }
              : undefined
          }
        >
          <div
            ref={viewportRef}
            className={cn(
              horizontal &&
                "sticky top-0 flex h-[100svh] items-center overflow-hidden pt-[4.5rem]",
            )}
          >
            {/* Contours along the bottom of the stage, drifting slower than the cards. */}
            {horizontal ? (
              <Terrain
                className="-z-10"
                fade="radial-gradient(ellipse 85% 55% at 65% 100%, #000 15%, transparent 80%)"
                progress={scrollYProgress}
                driftX={[0, -8]}
                driftY={[0, 0]}
              />
            ) : null}
            <motion.div
              ref={rowRef}
              style={horizontal ? { x } : undefined}
              className={cn(
                "relative",
                horizontal
                  ? "flex w-max items-stretch gap-6 pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] pr-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] pt-14"
                  : "mx-auto flex max-w-7xl flex-col px-6 py-24 sm:py-28 lg:px-10",
              )}
            >
              {horizontal ? (
                <div aria-hidden="true" className="pointer-events-none">
                  <span
                    className="absolute h-px bg-border-strong"
                    style={{
                      left: route.left,
                      width: route.width,
                      top: TRACK_Y,
                    }}
                  >
                    <motion.span
                      style={{ scaleX: routeFill }}
                      className="absolute inset-0 h-[2px] -translate-y-[0.5px] origin-left bg-accent"
                    />
                  </span>
                  {nodes.map((nodeX, index) => (
                    <TrackNode
                      key={index}
                      x={nodeX}
                      head={head}
                      final={index === nodes.length - 1}
                    />
                  ))}
                </div>
              ) : null}

              <IntroPanel ref={setPanel(0)} horizontal={horizontal} />

              {stages.map((stage, index) => (
                <React.Fragment key={stage.id}>
                  <StageCard
                    ref={setPanel(index + 1)}
                    stage={stage}
                    index={index}
                    panel={index + 1}
                    head={head}
                    layout={layout}
                    horizontal={horizontal}
                  />
                  {!horizontal ? (
                    <span
                      aria-hidden="true"
                      className="ml-[2.1rem] block h-8 w-px bg-accent/50"
                    />
                  ) : null}
                </React.Fragment>
              ))}

              <KeepPanel
                ref={setPanel(stages.length + 1)}
                panel={stages.length + 1}
                head={head}
                layout={layout}
                horizontal={horizontal}
              />
            </motion.div>
          </div>
        </div>
      </section>
    </GrowBand>
  );
}

/** A stop on the track: fills when the path reaches it, then branches down into its card. */
function TrackNode({
  x,
  head,
  final,
}: {
  x: number;
  head: MotionValue<number>;
  final: boolean;
}) {
  const reached = useTransform(() => clamp01((head.get() - x) / 48));
  const branch = useTransform(() => clamp01((head.get() - x - 24) / 64));

  return (
    <>
      <span
        className={cn(
          "absolute grid size-3.5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 bg-background",
          final ? "border-accent" : "border-accent/80",
        )}
        style={{ left: x, top: TRACK_Y }}
      >
        <motion.span
          style={{ scale: reached }}
          className="size-1.5 rounded-full bg-accent"
        />
      </span>
      <span
        className="absolute w-px -translate-x-1/2 bg-border-strong"
        style={{
          left: x,
          top: TRACK_Y + 7,
          height: CARD_TOP - TRACK_Y - 7,
        }}
      >
        <motion.span
          style={{ scaleY: branch }}
          className="absolute inset-0 origin-top bg-accent"
        />
      </span>
    </>
  );
}

/** 0 while a panel is still off to the right, 1 once it has moved well into view. */
function useArrival(
  head: MotionValue<number>,
  layout: MotionValue<PathLayout>,
  panel: number,
) {
  return useTransform(() => {
    const geometry = layout.get();
    const left = geometry.lefts[panel] ?? 0;
    const viewportRight = head.get() + geometry.viewport * (1 - NOW);
    const eased = clamp01((viewportRight - left) / (geometry.viewport * 0.32));
    return 1 - Math.pow(1 - eased, 3);
  });
}

const IntroPanel = React.forwardRef<HTMLDivElement, { horizontal: boolean }>(
  function IntroPanel({ horizontal }, ref) {
    const content = (
      <>
        <p className="eyebrow">03 · Process</p>
        <h2
          id="process-heading"
          className="mt-5 text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.25rem]"
        >
          Clear thinking, close collaboration, careful delivery.
        </h2>
        <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          The work stays close. You speak directly with the people making the
          technical decisions, from first conversation through handoff.
        </p>
        {horizontal ? (
          <p className="mt-10 flex items-center gap-3 font-mono text-xs text-muted-subtle">
            <span className="relative h-px w-10 overflow-hidden bg-border-strong">
              <span className="path-cue absolute inset-0 bg-accent" />
            </span>
            four stages, one path
          </p>
        ) : null}
      </>
    );

    return (
      <div
        ref={ref}
        className={cn(
          horizontal
            ? "flex w-[32rem] shrink-0 flex-col justify-center self-center pr-10"
            : "mb-14",
        )}
      >
        {horizontal ? content : <GrowIn>{content}</GrowIn>}
      </div>
    );
  },
);

interface PanelMotionProps {
  panel: number;
  head: MotionValue<number>;
  layout: MotionValue<PathLayout>;
  horizontal: boolean;
}

const StageCard = React.forwardRef<
  HTMLElement,
  PanelMotionProps & { stage: Stage; index: number }
>(function StageCard({ stage, index, panel, head, layout, horizontal }, ref) {
  const arrival = useArrival(head, layout, panel);
  const opacity = useTransform(arrival, [0, 1], [0.2, 1]);
  const y = useTransform(arrival, [0, 1], [56, 0]);
  const scale = useTransform(arrival, [0, 1], [0.95, 1]);

  const card = (
    <article
      aria-labelledby={`stage-${stage.id}`}
      onPointerMove={trackPointerLight}
      onPointerLeave={resetPointerLight}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border bg-surface/60 p-7 transition-colors duration-500 hover:border-accent/40 sm:p-8",
      )}
    >
      <span aria-hidden="true" className="border-light rounded-2xl" />

      <div className="flex items-center gap-3 font-mono text-xs">
        {!horizontal ? (
          <span className="grid size-3.5 place-items-center rounded-full border-2 border-accent bg-background">
            <span className="size-1.5 rounded-full bg-accent" />
          </span>
        ) : null}
        <span className="text-accent">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="h-px w-6 bg-accent/50" />
        <span className="text-muted-subtle">{stage.keyword}</span>
      </div>

      <h3
        id={`stage-${stage.id}`}
        className="mt-6 text-2xl font-medium leading-tight tracking-[-0.02em] text-foreground lg:text-[1.7rem]"
      >
        {stage.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {stage.description}
      </p>

      <div className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-subtle">
            Practices
          </p>
          <ul className="mt-3 space-y-2">
            {stage.practices.map((practice) => (
              <li
                key={practice}
                className="flex gap-2 text-sm leading-6 text-foreground"
              >
                <span aria-hidden="true" className="font-mono text-accent">
                  ▹
                </span>
                {practice}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-subtle">
            Leaves in your repo
          </p>
          <RepoTree artifacts={stage.artifacts} className="mt-3" />
        </div>
      </div>
    </article>
  );

  if (!horizontal) {
    return (
      <GrowIn offset={["start 95%", "start 55%"]}>
        <div ref={ref as React.Ref<HTMLDivElement>}>{card}</div>
      </GrowIn>
    );
  }

  return (
    <motion.div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{ opacity, y, scale }}
      className="w-[34rem] shrink-0"
    >
      {card}
    </motion.div>
  );
});

const KeepPanel = React.forwardRef<HTMLDivElement, PanelMotionProps>(
  function KeepPanel({ panel, head, layout, horizontal }, ref) {
    const arrival = useArrival(head, layout, panel);
    const opacity = useTransform(arrival, [0, 1], [0.2, 1]);
    const y = useTransform(arrival, [0, 1], [56, 0]);

    const everything: Artifact[] = stages.flatMap((stage) => stage.artifacts);

    const content = (
      <div className="flex h-full flex-col justify-center rounded-2xl border border-accent/30 bg-surface/40 p-7 sm:p-8">
        <p className="font-mono text-xs text-accent">~/your-product</p>
        <h3 className="mt-5 text-2xl font-medium tracking-[-0.02em] text-foreground lg:text-[1.7rem]">
          What stays with you
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Everything we produce lives in your repository, as plain files your
          team can read, review and extend.
        </p>
        <RepoTree
          root="your-product/"
          artifacts={everything}
          summarize
          className="mt-5 border-t border-border pt-4 leading-[1.4rem]"
        />
        <div className="mt-8">
          <Magnetic>
            <Button size="lg" onClick={() => goToContact()}>
              Start a project
              <span
                aria-hidden="true"
                className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-1"
              >
                →
              </span>
            </Button>
          </Magnetic>
        </div>
      </div>
    );

    if (!horizontal) {
      return (
        <div ref={ref} className="mt-6">
          <GrowIn offset={["start 95%", "start 55%"]}>{content}</GrowIn>
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        style={{ opacity, y }}
        className="w-[34rem] shrink-0"
      >
        {content}
      </motion.div>
    );
  },
);

interface RepoTreeProps {
  artifacts: Artifact[];
  /** Repository root shown above the folders. */
  root?: string;
  /** Show each folder with a file count instead of listing its files. */
  summarize?: boolean;
  className?: string;
}

/** Folders and files drawn as a directory tree, in the brand's terminal vernacular. */
function RepoTree({ artifacts, root, summarize, className }: RepoTreeProps) {
  const lines: {
    glyph: string;
    name: string;
    kind: "dir" | "file";
    note?: string;
  }[] = [];

  if (root) lines.push({ glyph: "", name: root, kind: "dir" });
  artifacts.forEach((artifact, dirIndex) => {
    const lastDir = dirIndex === artifacts.length - 1;
    lines.push({
      glyph: root ? (lastDir ? "└─ " : "├─ ") : "",
      name: artifact.dir,
      kind: "dir",
      note: summarize
        ? artifact.files.length
          ? `${artifact.files.length} file${artifact.files.length > 1 ? "s" : ""}`
          : "code"
        : undefined,
    });
    if (summarize) return;
    artifact.files.forEach((file, fileIndex) => {
      const lastFile = fileIndex === artifact.files.length - 1;
      const indent = root ? (lastDir ? "   " : "│  ") : "";
      lines.push({
        glyph: `${indent}${lastFile ? "└─ " : "├─ "}`,
        name: file,
        kind: "file",
      });
    });
  });

  return (
    <ul className={cn("font-mono text-xs leading-6", className)}>
      {lines.map((line, index) => (
        <li key={index} className="flex whitespace-pre">
          <span aria-hidden="true" className="text-muted-subtle">
            {line.glyph}
          </span>
          <span
            className={cn(
              "transition-colors duration-300",
              line.kind === "dir"
                ? "text-foreground"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          >
            {line.name}
          </span>
          {line.note ? (
            <span className="ml-auto pl-4 text-muted-subtle">{line.note}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
