"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { GrowIn, useWindow } from "@/components/motion/grow";
import { Magnetic } from "@/components/motion/magnetic";
import { usePrefersReducedMotion } from "@/components/motion/use-media-query";
import {
  engagements,
  type Engagement,
} from "@/components/sections/engagements/data";
import { Button } from "@/components/ui/button";
import { startRequest } from "@/lib/contact";
import { clamp01, easeOutCubic } from "@/lib/motion";
import { cn } from "@/lib/utils";

const pad = (value: number) => String(value).padStart(2, "0");

/** Where "now" sits as the page scrolls, as a share of the viewport height. */
const NOW = "70%";

/** Measured positions inside the trunk's container, in px. Transforms never affect them. */
interface Geometry {
  height: number;
  /** The request node, then the trunk's end at the last branch. */
  origin: number;
  last: number;
  /** Centre of each branch node, and how far "now" must travel to finish that lane. */
  nodes: number[];
  spans: number[];
}

/** Offset of an element from the top of `root`, walking up the offset parents. */
function topWithin(element: HTMLElement, root: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

export function Engagements() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const reduced = React.useRef(shouldReduceMotion);
  reduced.current = shouldReduceMotion;

  const treeRef = React.useRef<HTMLDivElement>(null);
  const originRef = React.useRef<HTMLSpanElement>(null);
  const rowRefs = React.useRef<(HTMLElement | null)[]>([]);
  const markRefs = React.useRef<(HTMLElement | null)[]>([]);

  const layout = useMotionValue<Geometry>({
    height: 1,
    origin: 0,
    last: 0,
    nodes: [],
    spans: [],
  });
  const [trunk, setTrunk] = React.useState({ top: 0, height: 0 });

  React.useEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;

    const measure = () => {
      const centre = (element: HTMLElement | null) =>
        element ? topWithin(element, tree) + element.offsetHeight / 2 : 0;

      const nodes = engagements.map((_, index) => centre(markRefs.current[index]));
      const spans = engagements.map(
        (_, index) => (rowRefs.current[index]?.offsetHeight ?? 1) * 0.75,
      );
      const origin = centre(originRef.current);
      const last = nodes[nodes.length - 1] ?? origin;

      layout.set({ height: tree.offsetHeight, origin, last, nodes, spans });
      setTrunk({ top: origin, height: Math.max(0, last - origin) });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tree);
    rowRefs.current.forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, [layout]);

  // One timeline for the whole trunk: `head` is where "now" falls inside the container.
  const { scrollYProgress } = useScroll({
    target: treeRef,
    offset: [`start ${NOW}`, `end ${NOW}`],
  });
  const head = useTransform(() =>
    reduced.current
      ? Number.POSITIVE_INFINITY
      : scrollYProgress.get() * layout.get().height,
  );
  const trunkFill = useTransform(() => {
    const { origin, last } = layout.get();
    const length = last - origin;
    return length > 0 ? clamp01((head.get() - origin) / length) : 0;
  });

  return (
    <section
      id="engagements"
      aria-labelledby="engagements-heading"
      className="mx-auto max-w-7xl px-6 pb-24 pt-24 sm:pb-28 sm:pt-28 lg:px-10 lg:pb-32 lg:pt-36"
    >
      <GrowIn offset={["start 95%", "start 45%"]}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow">02 · Engagements</p>
            <h2
              id="engagements-heading"
              className="mt-5 text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.5rem]"
            >
              Start the way that fits where you are.
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Each one starts with a short request, and asking commits you to
            nothing. Pick the situation closest to yours.
          </p>
        </div>
      </GrowIn>

      {/* One trunk, three branches. How far each lane runs is how long you commit. */}
      <div ref={treeRef} className="relative mt-12 pl-8 lg:mt-16">
        <span
          aria-hidden="true"
          className="absolute left-[6.5px] w-px bg-border-strong"
          style={{ top: trunk.top, height: trunk.height }}
        >
          <motion.span
            style={{ scaleY: trunkFill }}
            className="absolute inset-y-0 -left-[0.5px] w-[2px] origin-top bg-accent"
          />
        </span>

        <div className="relative pb-2">
          <span
            ref={originRef}
            aria-hidden="true"
            className="absolute -left-8 top-0.5 size-3.5 rounded-full border-2 border-accent bg-accent"
          />
          <p className="font-mono text-xs text-accent">your request</p>
        </div>

        {engagements.map((engagement, index) => (
          <LaneRow
            key={engagement.id}
            engagement={engagement}
            index={index}
            head={head}
            layout={layout}
            rowRef={(element) => {
              rowRefs.current[index] = element;
            }}
            markRef={(element) => {
              markRefs.current[index] = element;
            }}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * 0 until `head` is `from` px past this branch's node, 1 once it is `length` px further on.
 * Every part of a row hangs off this one clock, so the trunk, the lane, the words and the
 * button always arrive in order.
 */
function useBeat(
  head: MotionValue<number>,
  layout: MotionValue<Geometry>,
  index: number,
  from: number,
  length: number | "span",
) {
  return useTransform(() => {
    const geometry = layout.get();
    const y = geometry.nodes[index];
    if (y === undefined) return 0;
    const run = length === "span" ? geometry.spans[index] || 1 : length;
    return clamp01((head.get() - (y + from)) / run);
  });
}

interface LaneRowProps {
  engagement: Engagement;
  index: number;
  head: MotionValue<number>;
  layout: MotionValue<Geometry>;
  rowRef: (element: HTMLElement | null) => void;
  markRef: (element: HTMLElement | null) => void;
}

function LaneRow({
  engagement,
  index,
  head,
  layout,
  rowRef,
  markRef,
}: LaneRowProps) {
  const titleId = `engagement-${engagement.id}`;

  // The trunk reaches the node, then the lane draws while the words arrive just ahead of it.
  const lane = useBeat(head, layout, index, 0, "span");
  const arrived = useBeat(head, layout, index, 0, 28);
  const wordsIn = useBeat(head, layout, index, -170, 240);
  const factsIn = useBeat(head, layout, index, -110, 240);
  const buttonIn = useBeat(head, layout, index, -50, 240);

  return (
    <article
      ref={rowRef}
      aria-labelledby={titleId}
      className="relative py-10 lg:py-12"
    >
      <span
        ref={markRef}
        aria-hidden="true"
        className="absolute -left-8 top-[2.6rem] grid size-3.5 place-items-center rounded-full border-2 border-accent/80 bg-background lg:top-[3.1rem]"
      >
        <motion.span
          style={{ scale: arrived }}
          className="size-1.5 rounded-full bg-accent"
        />
      </span>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_auto] lg:gap-x-14 lg:gap-y-8">
        <Arrive
          value={wordsIn}
          className="lg:col-start-1 lg:row-start-1 lg:self-end"
        >
          <p className="flex items-center gap-3 font-mono text-xs">
            <span className="text-accent">{pad(index + 1)}</span>
            <span aria-hidden="true" className="h-px w-6 bg-accent/50" />
            <span className="text-muted-subtle">{engagement.keyword}</span>
          </p>
          <h3
            id={titleId}
            className="mt-5 max-w-md text-3xl font-medium leading-[1.08] tracking-[-0.025em] text-foreground sm:text-4xl"
          >
            {engagement.title}
          </h3>
          <p className="mt-4 max-w-sm text-base leading-7 text-muted-foreground">
            {engagement.summary}
          </p>
        </Arrive>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <Lane id={engagement.id} progress={lane} />
          <Arrive value={factsIn}>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-8">
              {[
                { label: "commitment", value: engagement.commitment },
                { label: "scope", value: engagement.scope },
              ].map((fact) => (
                <div key={fact.label}>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-subtle">
                    {fact.label}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-foreground">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Arrive>
        </div>

        <Arrive
          value={buttonIn}
          className="lg:col-start-1 lg:row-start-2 lg:self-start"
        >
          <Magnetic>
            <Button
              size="lg"
              onClick={() => startRequest(engagement.prefill)}
            >
              {engagement.cta}
              <span
                aria-hidden="true"
                className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-1"
              >
                →
              </span>
            </Button>
          </Magnetic>
        </Arrive>
      </div>
    </article>
  );
}

/** Rises and fades in as its beat plays, scrubbed to scroll like the rest of the site. */
function Arrive({
  value,
  className,
  children,
}: {
  value: MotionValue<number>;
  className?: string;
  children: React.ReactNode;
}) {
  const eased = useTransform(value, easeOutCubic);
  const opacity = useTransform(eased, [0, 1], [0.15, 1]);
  const y = useTransform(eased, [0, 1], [32, 0]);

  return (
    <motion.div style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ---------- Lanes: the shape of each commitment over time ---------- */

/** Where along a run (as a share of its length) a point at `x` is reached, mapped to scroll. */
const reach = (x: number, extent: number, [from, to]: [number, number]) =>
  from + Math.min(1, x / extent) * (to - from);

function Lane({
  id,
  progress,
}: {
  id: Engagement["id"];
  progress: MotionValue<number>;
}) {
  return (
    <div aria-hidden="true" className="relative h-32 w-full select-none">
      {id === "fixed" ? <FixedLane progress={progress} /> : null}
      {id === "embedded" ? <EmbeddedLane progress={progress} /> : null}
      {id === "review" ? <ReviewLane progress={progress} /> : null}
    </div>
  );
}

interface PartProps {
  progress: MotionValue<number>;
}

/** One project, start to finish: a bounded run with four stops and one end. */
function FixedLane({ progress }: PartProps) {
  const extent = 82;
  const draw: [number, number] = [0.12, 0.72];
  const stops = [
    { x: 0, label: "brief" },
    { x: 27, label: "estimate" },
    { x: 54, label: "build" },
    { x: extent, label: "release" },
  ];

  return (
    <>
      <Dimension progress={progress} from={0} to={extent} label="one project" />
      <Run progress={progress} from={0} to={extent} at={50} draw={draw} />
      {stops.map((stop, index) => {
        const at = reach(stop.x, extent, draw);
        return (
          <React.Fragment key={stop.label}>
            <Mark
              progress={progress}
              x={stop.x}
              at={at}
              end={index === stops.length - 1}
            />
            <Tag
              progress={progress}
              x={stop.x}
              at={at}
              align={index === 0 ? "start" : "center"}
            >
              {stop.label}
            </Tag>
          </React.Fragment>
        );
      })}
    </>
  );
}

/** Ongoing: the same loop again and again, running off the edge, with a signal that never stops. */
function EmbeddedLane({ progress }: PartProps) {
  const extent = 100;
  const draw: [number, number] = [0.12, 0.78];
  const stops = [
    { x: 0, label: "roadmap" },
    { x: 24, label: "build" },
    { x: 46, label: "ship" },
    { x: 68, label: "review" },
    { x: 90, label: "roadmap" },
  ];
  const cue = useWindow(progress, 0.78, 0.92);
  const fade = "linear-gradient(90deg, #000 0%, #000 70%, transparent 100%)";

  return (
    <>
      <Dimension
        progress={progress}
        from={0}
        to={extent}
        label="ongoing"
        open
      />
      <div
        className="absolute inset-0"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        <Run progress={progress} from={0} to={extent} at={50} draw={draw} />
        <motion.span
          style={{ opacity: cue }}
          className="absolute inset-x-0 top-1/2 -mt-px h-[2px] overflow-hidden motion-reduce:hidden"
        >
          <span className="path-cue absolute inset-0 bg-[linear-gradient(90deg,transparent_38%,var(--accent)_50%,transparent_62%)]" />
        </motion.span>
      </div>
      {stops.map((stop, index) => {
        const at = reach(stop.x, extent, draw);
        return (
          <React.Fragment key={`${stop.label}-${stop.x}`}>
            <Mark progress={progress} x={stop.x} at={at} />
            <Tag
              progress={progress}
              x={stop.x}
              at={at}
              align={index === 0 ? "start" : "center"}
            >
              {stop.label}
            </Tag>
          </React.Fragment>
        );
      })}
    </>
  );
}

/** Decide first: a short run to one decision, then two exits that are both fine. */
function ReviewLane({ progress }: PartProps) {
  const fork = 46;
  const main: [number, number] = [0.1, 0.42];
  // Captions alternate above and below the line, so three of them fit even on a phone.
  const stops: {
    x: number;
    label: string;
    side: "above" | "below";
    diamond?: boolean;
  }[] = [
    { x: 0, label: "system", side: "below" },
    { x: 18, label: "options", side: "above" },
    { x: 34, label: "decision", side: "below", diamond: true },
  ];
  const forkAt = 0.42;
  const exits = [
    { y: 21, label: "build with us" },
    { y: 79, label: "build without us" },
  ];

  return (
    <>
      <Dimension
        progress={progress}
        from={0}
        to={fork}
        label="short, bounded"
      />
      <Run progress={progress} from={0} to={fork} at={50} draw={main} />
      {stops.map((stop, index) => {
        const at = reach(stop.x, fork, main);
        return (
          <React.Fragment key={stop.label}>
            <Mark
              progress={progress}
              x={stop.x}
              at={at}
              diamond={stop.diamond}
            />
            <Tag
              progress={progress}
              x={stop.x}
              at={at}
              side={stop.side}
              align={index === 0 ? "start" : "center"}
            >
              {stop.label}
            </Tag>
          </React.Fragment>
        );
      })}

      <Run
        progress={progress}
        axis="y"
        from={21}
        to={79}
        at={fork}
        draw={[forkAt, forkAt + 0.12]}
      />
      {exits.map((exit) => (
        <React.Fragment key={exit.label}>
          <Run
            progress={progress}
            from={fork}
            to={58}
            at={exit.y}
            draw={[forkAt + 0.12, 0.8]}
          />
          <Mark progress={progress} x={58} y={exit.y} at={0.8} end />
          <Tag progress={progress} x={58} y={exit.y} at={0.8} side="right">
            {exit.label}
          </Tag>
        </React.Fragment>
      ))}
    </>
  );
}

interface RunProps extends PartProps {
  /** Start and end along the run's axis, as a share of the lane. */
  from: number;
  to: number;
  /** Position on the other axis, as a share of the lane. */
  at: number;
  axis?: "x" | "y";
  /** Scroll window over which the accent line is drawn along the track. */
  draw: [number, number];
}

/** A faint track that is always there, and an accent line drawn along it by scroll. */
function Run({ progress, from, to, at, axis = "x", draw }: RunProps) {
  const fill = useWindow(progress, draw[0], draw[1]);
  const horizontal = axis === "x";

  return (
    <span
      className="absolute"
      style={
        horizontal
          ? { left: `${from}%`, width: `${to - from}%`, top: `${at}%` }
          : { top: `${from}%`, height: `${to - from}%`, left: `${at}%` }
      }
    >
      <span
        className={cn(
          "absolute bg-border-strong",
          horizontal ? "inset-x-0 top-0 h-px" : "inset-y-0 left-0 w-px",
        )}
      />
      <motion.span
        style={horizontal ? { scaleX: fill } : { scaleY: fill }}
        className={cn(
          "absolute bg-accent",
          horizontal
            ? "inset-x-0 -top-px h-[2px] origin-left"
            : "inset-y-0 -left-px w-[2px] origin-top",
        )}
      />
    </span>
  );
}

interface MarkProps extends PartProps {
  x: number;
  y?: number;
  /** Scroll progress at which the line reaches this stop. */
  at: number;
  /** Where a lane finishes. */
  end?: boolean;
  diamond?: boolean;
}

/** A stop on a lane: a ring that fills once the line arrives. */
function Mark({ progress, x, y = 50, at, end, diamond }: MarkProps) {
  const reached = useWindow(progress, at - 0.05, at);

  return (
    <span
      className={cn(
        "absolute grid size-3.5 -translate-x-1/2 -translate-y-1/2 place-items-center border-2 bg-background",
        diamond ? "rotate-45 rounded-[3px]" : "rounded-full",
        end ? "border-accent" : "border-accent/70",
      )}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <motion.span
        style={{ scale: reached }}
        className={cn(
          "size-1.5 bg-accent",
          diamond ? "rounded-[1px]" : "rounded-full",
        )}
      />
    </span>
  );
}

interface TagProps extends PartProps {
  x: number;
  y?: number;
  at: number;
  side?: "below" | "above" | "right";
  align?: "start" | "center";
  children: React.ReactNode;
}

/** Mono caption for a stop, which settles in as the line reaches it. */
function Tag({
  progress,
  x,
  y = 50,
  at,
  side = "below",
  align = "center",
  children,
}: TagProps) {
  const shown = useWindow(progress, at - 0.04, at + 0.03);
  const top =
    side === "right"
      ? `${y}%`
      : side === "above"
        ? `calc(${y}% - 1.1rem)`
        : `calc(${y}% + 1.1rem)`;

  return (
    <motion.span
      style={{
        opacity: shown,
        left: side === "right" ? `calc(${x}% + 1.15rem)` : `${x}%`,
        top,
      }}
      className={cn(
        "absolute whitespace-nowrap font-mono text-[11px] leading-none text-muted-subtle",
        side === "right" && "-translate-y-1/2",
        side === "above" && "-translate-y-full",
        side !== "right" && align === "center" && "-translate-x-1/2",
      )}
    >
      {children}
    </motion.span>
  );
}

interface DimensionProps extends PartProps {
  from: number;
  to: number;
  label: string;
  /** No end tick: the run carries on past the edge. */
  open?: boolean;
}

/** A dimension line, as on a technical drawing: how far this commitment reaches. */
function Dimension({ progress, from, to, label, open }: DimensionProps) {
  const shown = useWindow(progress, 0.04, 0.22);

  return (
    <motion.span
      style={{
        opacity: shown,
        left: `${from}%`,
        width: `${to - from}%`,
      }}
      className="absolute top-1 flex items-center"
    >
      <span className="h-2 w-px bg-border-strong" />
      <span
        className={cn(
          "h-px flex-1",
          open
            ? "bg-gradient-to-r from-border-strong to-transparent"
            : "bg-border-strong",
        )}
      />
      {open ? null : <span className="h-2 w-px bg-border-strong" />}
      <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-background px-2 font-mono text-[10.5px] leading-none text-muted-subtle">
        {label}
      </span>
    </motion.span>
  );
}
