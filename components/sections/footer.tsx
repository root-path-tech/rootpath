"use client";

import { motion } from "motion/react";

import { GrowBand } from "@/components/motion/grow";
import {
  resetPointerLight,
  trackPointerLight,
} from "@/components/motion/pointer-light";
import { usePrefersReducedMotion } from "@/components/motion/use-media-query";
import { CliSignature, LogoMark } from "@/components/ui/logo";
import { Reveal } from "@/components/ui/reveal";
import { sectionLinks } from "@/lib/nav";

const spring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 22,
  mass: 0.8,
};

/** The page index as a terminal panel, in the same frame as the Services and Process stages. */
function IndexPanel() {
  return (
    <nav
      aria-label="Footer navigation"
      onPointerMove={trackPointerLight}
      onPointerLeave={resetPointerLight}
      className="relative rounded-2xl border border-border bg-surface/50"
    >
      <span aria-hidden="true" className="border-light rounded-2xl" />
      <div className="flex items-center justify-between gap-6 border-b border-border px-5 py-3.5 font-mono text-xs text-muted-subtle">
        <span>~/root-path</span>
        <span className="tabular-nums">
          {String(sectionLinks.length).padStart(2, "0")} routes
        </span>
      </div>
      <ul className="p-2">
        {sectionLinks.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="group flex items-center justify-between gap-6 rounded-lg px-3 py-3 font-mono text-[13px] lowercase text-muted-foreground outline-none transition-colors duration-300 ease-out hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {link.label}
              <span
                aria-hidden="true"
                className="text-muted-subtle transition-[color,transform] duration-300 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-accent group-focus-visible:text-accent"
              >
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <GrowBand foldOut={false}>
      <footer id="footer" className="footer-light relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.55fr)] lg:items-end lg:gap-20">
            <Reveal>
              <p className="eyebrow">Start with a conversation</p>
              <h2 className="mt-6 max-w-4xl text-[clamp(2.75rem,6.4vw,6rem)] font-medium leading-[0.96] tracking-[-0.035em] text-foreground">
                A clearer next move starts here.
              </h2>
              <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Bring a product question, a technical constraint, or a release
                that needs a sharper path.
              </p>
              <motion.a
                href="#process"
                initial="rest"
                whileHover={shouldReduceMotion ? undefined : "hover"}
                variants={{ rest: {}, hover: {} }}
                className="group mt-9 inline-flex h-12 items-center gap-2 rounded-lg border border-border-strong px-5 text-sm font-medium text-foreground outline-none transition-[background-color,border-color,transform] duration-300 ease-out hover:border-accent/60 hover:bg-surface active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                See how we work
                <motion.span
                  aria-hidden="true"
                  variants={{
                    rest: { transform: "translateX(0)" },
                    hover: { transform: "translateX(4px)" },
                  }}
                  transition={spring}
                  className="text-muted-foreground transition-colors duration-300 ease-out group-hover:text-accent group-focus-visible:text-accent"
                >
                  →
                </motion.span>
              </motion.a>
            </Reveal>

            <Reveal as="aside" delay={0.1}>
              <IndexPanel />
            </Reveal>
          </div>

          <div className="mt-20 grid gap-6 border-t border-border pt-8 sm:mt-24 md:grid-cols-[1fr_auto] md:items-end">
            <div className="flex flex-col gap-3">
              <a
                href="#top"
                aria-label="Root-Path, back to top"
                className="inline-flex w-fit items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <LogoMark className="text-lg leading-none" />
              </a>
              <p className="text-sm text-muted-foreground">
                Designed and developed in-house, every pixel and every line of
                code.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <CliSignature cursor className="text-sm" />
              <p className="font-mono text-xs text-muted-subtle">
                design · frontend · backend · engineering management
              </p>
            </div>
          </div>
        </div>
      </footer>
    </GrowBand>
  );
}
