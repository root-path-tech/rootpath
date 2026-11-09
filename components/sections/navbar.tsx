"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

import { usePrefersReducedMotion } from "@/components/motion/use-media-query";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { goToContact } from "@/lib/contact";
import { sectionLinks } from "@/lib/nav";
import { cn } from "@/lib/utils";

const spring = {
  type: "spring" as const,
  stiffness: 320,
  damping: 24,
  mass: 0.7,
};

/** True while a `[data-band]` section sits behind the navbar's vertical centre. */
function useOverBand() {
  const [over, setOver] = React.useState(false);

  React.useEffect(() => {
    const bands = Array.from(document.querySelectorAll("[data-band]"));
    if (!bands.length) return;
    const visible = new Set<Element>();
    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      visible.clear();
      // A 2px line across the viewport at the navbar's centre (top-4 + half its height).
      const line = 44;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
          });
          setOver(visible.size > 0);
        },
        {
          rootMargin: `-${line}px 0px -${Math.max(0, window.innerHeight - line - 2)}px 0px`,
        },
      );
      bands.forEach((band) => observer?.observe(band));
    };

    observe();
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
  }, []);

  return over;
}

export function Navbar() {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileShellOpen, setMobileShellOpen] = React.useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();

  const closeMobileMenu = () => setMobileOpen(false);
  const toggleMobileMenu = () => {
    setMobileOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) setMobileShellOpen(true);
      return nextOpen;
    });
  };

  // Over a System Black band the bar takes the band's tones, so it changes with the section.
  const overBand = useOverBand();

  return (
    <header className="sticky top-4 z-40 mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl">
      <div
        data-tone={overBand ? "inverse" : undefined}
        className={cn(
          "relative rounded-lg border border-border-strong/70 bg-background/80 text-foreground backdrop-blur-xl transition-[background-color,border-color,color] duration-500 ease-[var(--ease-out)]",
          mobileShellOpen && "rounded-b-none border-b-0",
        )}
      >
        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
          <a
            href="#top"
            aria-label="Root-Path home"
            className="inline-flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <LogoMark className="text-base sm:text-[17px]" />
          </a>

          <nav
            aria-label="Primary navigation"
            onMouseLeave={() => setHoveredItem(null)}
            className="hidden items-center gap-1 md:flex"
          >
            {sectionLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.label)}
                onFocus={() => setHoveredItem(item.label)}
                onBlur={() => setHoveredItem(null)}
                className="relative rounded-md px-3 py-2 font-mono text-[13px] lowercase text-muted-foreground outline-none transition-colors duration-500 hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {hoveredItem === item.label ? (
                  <motion.span
                    layoutId="nav-hover-surface"
                    className="absolute inset-0 rounded-md bg-surface"
                    transition={shouldReduceMotion ? { duration: 0 } : spring}
                  />
                ) : null}
                <span className="relative z-10">{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                goToContact();
              }}
              className="hidden md:inline-flex"
            >
              Start a project
            </Button>
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={toggleMobileMenu}
              className="relative z-10 inline-flex cursor-pointer rounded-md border border-border-strong px-3.5 py-2 font-mono text-xs text-foreground outline-none transition-[background-color,transform] duration-500 ease-out hover:bg-surface active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-accent/70 md:hidden"
            >
              {mobileOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        <AnimatePresence
          initial={false}
          onExitComplete={() => setMobileShellOpen(false)}
        >
          {mobileOpen ? (
            <motion.nav
              id="mobile-navigation"
              key="mobile-navigation"
              aria-label="Mobile navigation"
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      transform: "translateY(-6px)",
                      clipPath: "inset(0 0 100% 0)",
                    }
              }
              animate={{
                transform: "translateY(0)",
                clipPath: "inset(0 0 0% 0)",
              }}
              exit={
                shouldReduceMotion
                  ? undefined
                  : {
                      transform: "translateY(-6px)",
                      clipPath: "inset(0 0 100% 0)",
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
              }
              style={{ transformOrigin: "top" }}
              className="absolute -left-px -right-px top-[calc(100%-1px)] z-50 rounded-b-lg border-x border-b border-border-strong/70 bg-background px-3 pb-3 pt-2 backdrop-blur-xl will-change-[clip-path,transform] md:hidden"
            >
              {sectionLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="block rounded-md px-3 py-2.5 font-mono text-[13px] lowercase text-muted-foreground outline-none transition-colors duration-500 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  {item.label}
                </a>
              ))}
              <Button
                size="default"
                onClick={() => {
                  closeMobileMenu();
                  goToContact();
                }}
                className="mt-2 w-full"
              >
                Start a project
              </Button>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
