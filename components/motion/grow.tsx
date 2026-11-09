"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { easeOutCubic } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** A fully folded band: inset this percentage of the width on each side... */
export const FOLD_INSET = 4.5;
/** ...with corners rounded this much. Capped by viewport height, so the thin slice that shows
    first still reads as a panel top with a flat edge, rather than two corners meeting. */
export const FOLD_RADIUS = "min(44px, 3.5svh)";

interface GrowBandProps {
  children: React.ReactNode;
  className?: string;
  /** Fold back in as the band's end leaves the viewport. Off for the last band on the page. */
  foldOut?: boolean;
  /**
   * How far down the viewport (percent) the band's top is when it starts to unfold. Above the
   * default when something on screen already shows the band's folded top at that height.
   */
  unfoldFrom?: number;
}

/**
 * A full-bleed System Black band that grows out of the page: it enters as an inset,
 * rounded panel and unfolds to full width as its top reaches the upper part of the
 * viewport, then folds back in as it leaves. Scrubbed to scroll position, so a wheel
 * scroll and a CTA glide play exactly the same transition and always land settled.
 */
export function GrowBand({
  children,
  className,
  foldOut = true,
  unfoldFrom = 95,
}: GrowBandProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  // Starts with the band's top near the bottom of the viewport, so it is still fully folded as
  // it comes into view and unfolds as it rises.
  const { scrollYProgress: enter } = useScroll({
    target: ref,
    offset: [`start ${unfoldFrom}%`, "start 18%"] as never,
  });
  const { scrollYProgress: leave } = useScroll({
    target: ref,
    offset: ["end 85%", "end 15%"],
  });

  const clipPath = useTransform([enter, leave], ([e, l]: number[]) => {
    const fold = Math.max(
      1 - easeOutCubic(e),
      foldOut ? easeOutCubic(l) * 0.8 : 0,
    );
    const inset = (fold * FOLD_INSET).toFixed(3);
    return `inset(0% ${inset}% 0% ${inset}% round calc(${fold.toFixed(3)} * ${FOLD_RADIUS}))`;
  });

  return (
    <motion.div
      ref={ref}
      data-surface="inverse"
      data-band=""
      // Reduced motion: unfolded in CSS ([data-band]), so it never depends on hydration.
      style={{ clipPath }}
      className={cn("relative isolate", className)}
    >
      {children}
    </motion.div>
  );
}

/** Scroll progress of an element entering the viewport, for content that settles as it arrives. */
function useEnterProgress(
  ref: React.RefObject<HTMLElement | null>,
  offset: [string, string] = ["start end", "start 35%"],
) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as never,
  });
  return scrollYProgress;
}

interface GrowInProps {
  children: React.ReactNode;
  className?: string;
  /** Start and end of the transition, as `useScroll` offsets. */
  offset?: [string, string];
}

/**
 * Content that grows into place as it arrives: it rises, scales up from slightly smaller
 * and comes to full opacity, scrubbed to scroll. Reaches rest before the content reaches
 * the upper third of the viewport, so in-page jumps always land on settled content.
 */
export function GrowIn({ children, className, offset }: GrowInProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const progress = useEnterProgress(ref, offset);
  const eased = useTransform(progress, easeOutCubic);
  const y = useTransform(eased, [0, 1], [72, 0]);
  const scale = useTransform(eased, [0, 1], [0.94, 1]);
  const opacity = useTransform(eased, [0, 0.6, 1], [0.15, 0.85, 1]);

  return (
    <div ref={ref} className={className}>
      {/* Reduced motion: settled in CSS ([data-grow-in]), so it never depends on hydration. */}
      <motion.div
        data-grow-in=""
        style={{ y, scale, opacity, transformOrigin: "50% 0%" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Maps a progress value through a window, clamped, for scrubbed sub-animations. */
export function useWindow(
  progress: MotionValue<number>,
  from: number,
  to: number,
) {
  return useTransform(progress, [from, to], [0, 1], { clamp: true });
}
