"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

import { usePrefersReducedMotion } from "@/components/motion/use-media-query";
import { cn } from "@/lib/utils";

const settle = { stiffness: 220, damping: 18, mass: 0.6 };

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** Share of the pointer's offset from the centre that the element follows. */
  strength?: number;
}

/** Pulls its child gently toward a mouse pointer and springs back on leave. */
export function Magnetic({
  children,
  className,
  strength = 0.28,
}: MagneticProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, settle);
  const springY = useSpring(y, settle);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (shouldReduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (bounds.left + bounds.width / 2)) * strength);
    y.set((event.clientY - (bounds.top + bounds.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ x: springX, y: springY }}
      className={cn("inline-flex", className)}
    >
      {children}
    </motion.div>
  );
}
