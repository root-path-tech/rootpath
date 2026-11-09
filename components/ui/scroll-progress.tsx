"use client";

import { motion, useScroll, useSpring } from "motion/react";

import { usePrefersReducedMotion } from "@/components/motion/use-media-query";

/** Hairline reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.4,
  });

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-accent"
    />
  );
}
