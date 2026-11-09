"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { Terrain } from "@/components/motion/terrain";
import { routePath, type Point } from "@/components/sections/services/diagram";

interface FooterTerrainProps {
  /** The footer: the route's coordinate space and its scroll trigger. */
  rootRef: React.RefObject<HTMLElement | null>;
  /** The last element of the copy; the route runs below it. */
  copyRef: React.RefObject<HTMLElement | null>;
  /** The routes panel the route plugs into. */
  targetRef: React.RefObject<HTMLElement | null>;
  /** The divider above the footer's bottom row; the route runs above it. */
  floorRef: React.RefObject<HTMLElement | null>;
}

interface Geometry {
  width: number;
  height: number;
  points: Point[];
  /** Stops along the route, with how far along it (0..1) each one sits. */
  stops: { point: Point; at: number }[];
}

/** An element's offset within an ancestor from layout boxes, so transforms in between do not move it. */
function offsetWithin(element: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

function measure(
  root: HTMLElement,
  copy: HTMLElement,
  target: HTMLElement,
  floor: HTMLElement,
): Geometry {
  const width = root.clientWidth;
  const height = root.clientHeight;
  const panel = offsetWithin(target, root);
  const copyBottom = offsetWithin(copy, root).y + copy.offsetHeight;
  const panelBottom = panel.y + target.offsetHeight;
  const floorTop = offsetWithin(floor, root).y;

  // Run along the gap between the content and the bottom row, then climb into the panel.
  const runY = Math.round((Math.max(copyBottom, panelBottom) + floorTop) / 2);
  const climbX = Math.round(panel.x - 40);
  const endY = Math.round(panel.y + target.offsetHeight * 0.6);
  const points: Point[] = [
    [-24, runY],
    [climbX, runY],
    [climbX, endY],
    [panel.x - 1, endY],
  ];

  const run = climbX + 24;
  const total = run + (runY - endY) + (panel.x - 1 - climbX);
  const stops = [0.3, 0.62].map((share) => {
    const x = Math.round(-24 + run * share);
    return { point: [x, runY] as Point, at: (x + 24) / total };
  });
  stops.push({ point: [panel.x - 1, endY], at: 1 });

  return { width, height, points, stops };
}

/**
 * The footer's backdrop: topographic contours that drift slowly as the footer arrives, and one
 * route drawn across them, in the same orthogonal style as the service diagrams, that runs
 * along the bottom of the footer and plugs into the routes panel. The route is desktop only.
 */
export function FooterTerrain({
  rootRef,
  copyRef,
  targetRef,
  floorRef,
}: FooterTerrainProps) {
  const [geometry, setGeometry] = React.useState<Geometry | null>(null);
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start end", "end end"],
  });
  const drawn = useTransform(scrollYProgress, [0.45, 0.95], [0, 1], {
    clamp: true,
  });

  React.useEffect(() => {
    const root = rootRef.current;
    const update = () => {
      const copy = copyRef.current;
      const target = targetRef.current;
      const floor = floorRef.current;
      if (!root || !copy || !target || !floor) return;
      setGeometry(measure(root, copy, target, floor));
    };
    update();
    document.fonts?.ready.then(update);
    const observer = new ResizeObserver(update);
    if (root) observer.observe(root);
    return () => observer.disconnect();
  }, [rootRef, copyRef, targetRef, floorRef]);

  const d = React.useMemo(
    () => (geometry ? routePath(geometry.points, 18) : ""),
    [geometry],
  );

  return (
    <>
      {/* The lines gather towards the routes panel and fall away behind the headline. */}
      <Terrain
        fade="radial-gradient(ellipse 75% 95% at 82% 78%, #000 30%, transparent 82%)"
        opacity={0.16}
        progress={scrollYProgress}
        driftY={[-5, 0]}
      />
      {geometry ? (
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          fill="none"
        >
          <motion.path
            data-route-line=""
            d={d}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              pathLength: drawn,
              stroke: "var(--accent)",
              opacity: 0.75,
            }}
          />
          {geometry.stops.map((stop, index) => (
            <Stop
              key={index}
              point={stop.point}
              at={stop.at}
              last={index === geometry.stops.length - 1}
              drawn={drawn}
            />
          ))}
        </svg>
      ) : null}
    </>
  );
}

function Stop({
  point,
  at,
  last,
  drawn,
}: {
  point: Point;
  at: number;
  last: boolean;
  drawn: MotionValue<number>;
}) {
  const opacity = useTransform(drawn, [at - 0.02, at], [0, 1], {
    clamp: true,
  });
  const [cx, cy] = point;

  return (
    <motion.g data-route-node="" style={{ opacity }}>
      {last ? (
        <circle
          cx={cx}
          cy={cy}
          r={10}
          strokeWidth={1}
          style={{ stroke: "var(--accent)", opacity: 0.35 }}
        />
      ) : null}
      <circle
        cx={cx}
        cy={cy}
        r={last ? 4.5 : 4}
        strokeWidth={1.5}
        style={{
          fill: last ? "var(--accent)" : "var(--background)",
          stroke: "var(--accent)",
        }}
      />
    </motion.g>
  );
}
