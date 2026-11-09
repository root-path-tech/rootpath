"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "motion/react";

import { usePrefersReducedMotion } from "@/components/motion/use-media-query";
import { cn } from "@/lib/utils";

/** What the pointer is over decides how the ring behaves. */
const LINKS =
  'a[href], button, [role="button"], [role="tab"], label, select, summary';
const TEXT_FIELDS =
  'input:not([type="radio"], [type="checkbox"], [type="button"], [type="submit"], [type="range"]), textarea, [contenteditable="true"]';
const DARK_SURFACES = '[data-surface="inverse"], [data-tone="inverse"]';

type Mode = "idle" | "link" | "text";

/** Close to critically damped: the ring trails the pointer by a few milliseconds, never overshoots. */
const follow = { stiffness: 900, damping: 38, mass: 0.35 };

/**
 * A hollow ring in place of the system arrow. It enlarges over anything clickable, shrinks on
 * press, and turns light over System Black bands. Text fields keep the native I-beam, so typing
 * is never ambiguous.
 *
 * It is progressive: it only runs for a precise hovering pointer, never for touch or forced-colours
 * users, and the system cursor is only hidden once the ring is actually on screen (see `.has-cursor`
 * in globals.css).
 */
export function CustomCursor() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [enabled, setEnabled] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("idle");
  const [onDark, setOnDark] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, follow);
  const smoothY = useSpring(y, follow);

  const shown = React.useRef(false);
  const point = React.useRef({ x: 0, y: 0 });
  const lastTarget = React.useRef<EventTarget | null>(null);

  React.useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const forced = window.matchMedia("(forced-colors: active)");
    const update = () => setEnabled(fine.matches && !forced.matches);
    update();
    fine.addEventListener("change", update);
    forced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      forced.removeEventListener("change", update);
    };
  }, []);

  const classify = React.useCallback((target: Element | null) => {
    setMode(
      target?.closest(TEXT_FIELDS)
        ? "text"
        : target?.closest(LINKS)
          ? "link"
          : "idle",
    );
    setOnDark(Boolean(target?.closest(DARK_SURFACES)));
  }, []);

  React.useEffect(() => {
    if (!enabled) return;

    const hide = () => {
      shown.current = false;
      lastTarget.current = null;
      setVisible(false);
      setPressed(false);
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return hide();

      point.current = { x: event.clientX, y: event.clientY };
      x.set(event.clientX);
      y.set(event.clientY);

      // First move: appear in place instead of flying in from the corner.
      if (!shown.current) {
        shown.current = true;
        smoothX.jump(event.clientX);
        smoothY.jump(event.clientY);
        setVisible(true);
      }

      if (event.target !== lastTarget.current) {
        lastTarget.current = event.target;
        classify(event.target as Element | null);
      }
    };

    const handleDown = (event: PointerEvent) => {
      if (event.button === 0) setPressed(true);
    };
    const handleUp = () => setPressed(false);

    document.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerdown", handleDown, { passive: true });
    document.addEventListener("pointerup", handleUp, { passive: true });
    document.addEventListener("pointercancel", handleUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleUp);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      hide();
    };
  }, [enabled, x, y, smoothX, smoothY, classify]);

  // The page can scroll under a still pointer, so what it is over has to be re-read.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", () => {
    if (!shown.current) return;
    lastTarget.current = null;
    classify(document.elementFromPoint(point.current.x, point.current.y));
  });

  // Hide the system cursor only while the ring is showing.
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("has-cursor", enabled && visible);
    return () => root.classList.remove("has-cursor");
  }, [enabled, visible]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      // Over a System Black band the ring takes that band's light tokens.
      data-tone={onDark ? "inverse" : undefined}
      style={{
        x: shouldReduceMotion ? x : smoothX,
        y: shouldReduceMotion ? y : smoothY,
      }}
      // z-[100]: it has to sit above the sticky navbar (z-40) and the progress bar (z-60).
      className="pointer-events-none fixed left-0 top-0 z-[100] -ml-3.5 -mt-3.5 size-7 will-change-transform"
    >
      <div
        className={cn(
          "size-full rounded-full border-[1.5px] border-foreground/80 transition-[transform,opacity,border-color] duration-200 ease-[var(--ease-out)] motion-reduce:transition-none",
          !visible || mode === "text" ? "opacity-0" : "opacity-100",
          pressed
            ? "scale-[0.8]"
            : mode === "link"
              ? "scale-[1.6] border-accent"
              : "scale-100",
        )}
      />
    </motion.div>
  );
}
