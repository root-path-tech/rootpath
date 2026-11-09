"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { cn } from "@/lib/utils";

interface TerrainProps {
  /**
   * Where the lines show, as a CSS mask gradient; the rest of the surface stays clear for copy.
   * Black is fully drawn, transparent is clear.
   */
  fade: string;
  /** Mirror the drawing, so neighbouring sections do not show the same lines. */
  flip?: boolean;
  /** Line strength. The lines take the surface's accent colour. */
  opacity?: number;
  /** Scroll progress to drift with. Defaults to this layer passing through the viewport. */
  progress?: MotionValue<number>;
  /** How far it drifts across the progress, as [from, to] percentages of its own size. */
  driftY?: [number, number];
  driftX?: [number, number];
  className?: string;
}

/**
 * Topographic contour lines (public/textures/contours.svg) behind a surface, drifting slower
 * than the page so they read as a layer of depth. Shared by every section, the footer and the
 * 404 page; reduced motion holds them still (globals.css, [data-terrain]).
 */
export function Terrain({
  fade,
  flip = false,
  opacity = 0.14,
  progress,
  driftY = [4, -4],
  driftX = [0, 0],
  className,
}: TerrainProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const source = progress ?? scrollYProgress;
  const y = useTransform(
    source,
    [0, 1],
    driftY.map((v) => `${v}%`),
  );
  const x = useTransform(
    source,
    [0, 1],
    driftX.map((v) => `${v}%`),
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "terrain-fade pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      style={
        {
          "--contour-fade": fade,
        } as React.CSSProperties
      }
    >
      <motion.div
        data-terrain=""
        data-flip={flip ? "" : undefined}
        className="contour-field absolute -inset-[10%]"
        style={{ x, y, opacity, scaleX: flip ? -1 : 1 }}
      />
    </div>
  );
}
