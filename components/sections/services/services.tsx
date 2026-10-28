"use client";

import * as React from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

import { GrowBand, GrowIn } from "@/components/motion/grow";
import { Magnetic } from "@/components/motion/magnetic";
import { useMediaQuery } from "@/components/motion/use-media-query";
import { PEEK_SVH } from "@/components/sections/hero/data";
import { services, type Service } from "@/components/sections/services/data";
import { SystemDiagram } from "@/components/sections/services/diagram";
import { Button } from "@/components/ui/button";
import { goToContact } from "@/lib/contact";
import { ease } from "@/lib/motion";
import { scrollToElement } from "@/lib/smooth-scroll";
import { cn } from "@/lib/utils";

const COUNT = services.length;
const PANEL_ID = "services-panel";

/** Index of the service a `#service-<id>` link points at, or -1. */
function serviceFromHash(hash: string) {
  return services.findIndex((service) => hash === `#service-${service.id}`);
}

/**
 * The four services as one index: a name and one line each, so they read at a glance.
 * On desktop the selected service shows its system diagram and stack in a panel beside
 * the list; on phones each row opens in place.
 */
export function Services() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // Desktop: the service shown in the panel. Phones: the open row, if any.
  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState<number | null>(null);
  const intent = React.useRef<number | undefined>(undefined);

  // A link to #service-<id> (llms.txt, search results) selects and opens that service, then
  // brings its row into view; the browser's own jump lands short while the page settles.
  React.useEffect(() => {
    const selectFromHash = () => {
      const index = serviceFromHash(window.location.hash);
      if (index < 0) return;
      setActive(index);
      setOpen(index);
      const row = document.getElementById(`service-${services[index].id}`);
      if (row) requestAnimationFrame(() => scrollToElement(row));
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  React.useEffect(() => () => window.clearTimeout(intent.current), []);

  const select = (index: number) => {
    window.clearTimeout(intent.current);
    if (isDesktop) setActive(index);
    else setOpen((current) => (current === index ? null : index));
  };

  // Hovering a row previews it after a short pause, so sweeping across rows does not flicker.
  const preview = (index: number, event: React.PointerEvent) => {
    if (!isDesktop || event.pointerType !== "mouse") return;
    window.clearTimeout(intent.current);
    intent.current = window.setTimeout(() => setActive(index), 90);
  };

  return (
    // Its folded top already shows under the pinned hero, so it unfolds from that height.
    <GrowBand unfoldFrom={100 - PEEK_SVH}>
      <section
        id="services"
        aria-labelledby="services-heading"
        className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 sm:pt-28 lg:px-10 lg:pb-24 lg:pt-36"
      >
        <GrowIn offset={["start 95%", "start 40%"]}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
            <div>
              <p className="eyebrow">01 · Services</p>
              <h2
                id="services-heading"
                className="mt-5 text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.5rem]"
              >
                Focused digital services for teams ready to move.
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Four routes from the root of the problem to a working result your
              team can own. Take one, or combine them.
            </p>
          </div>
        </GrowIn>

        <GrowIn offset={["start 95%", "start 50%"]}>
          <div className="mt-12 grid lg:mt-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
            <div onPointerLeave={() => window.clearTimeout(intent.current)}>
              <div className="border-t border-border">
                {services.map((service, index) => (
                  <Row
                    key={service.id}
                    service={service}
                    index={index}
                    active={index === active}
                    open={index === open}
                    isDesktop={isDesktop}
                    onSelect={() => select(index)}
                    onPreview={(event) => preview(index, event)}
                  />
                ))}
              </div>
              <p className="hidden pt-6 font-mono text-[11px] text-muted-subtle lg:block">
                select a service to see its diagram and stack
              </p>
            </div>
            <Panel service={services[active]} index={active} />
          </div>
        </GrowIn>

        <GrowIn offset={["start end", "start 70%"]}>
          <div className="mt-16 flex flex-col gap-6 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between lg:mt-20">
            <div>
              <p className="font-mono text-sm text-accent">
                &gt; start --build --beyond
              </p>
              <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
                Not sure which route fits? Tell us where you are and we will map
                the path with you.
              </p>
            </div>
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
        </GrowIn>
      </section>
    </GrowBand>
  );
}

interface RowProps {
  service: Service;
  index: number;
  /** Desktop: shown in the panel. */
  active: boolean;
  /** Phones: opened in place. */
  open: boolean;
  isDesktop: boolean;
  onSelect: () => void;
  onPreview: (event: React.PointerEvent) => void;
}

function Row({
  service,
  index,
  active,
  open,
  isDesktop,
  onSelect,
  onPreview,
}: RowProps) {
  const detailId = `service-${service.id}-detail`;
  const expanded = isDesktop ? active : open;

  return (
    <div id={`service-${service.id}`} className="border-b border-border">
      <h3>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={isDesktop ? PANEL_ID : detailId}
          onClick={onSelect}
          onFocus={isDesktop ? onSelect : undefined}
          onPointerEnter={onPreview}
          className="group relative grid w-full grid-cols-[2.25rem_minmax(0,1fr)_1.5rem] items-start gap-x-3 py-6 text-left outline-none focus-visible:bg-surface/40 lg:grid-cols-[2.75rem_minmax(0,1fr)_auto] lg:gap-x-4 lg:py-7"
        >
          {/* Desktop: the selected row is underlined in the accent. */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute -bottom-px left-0 hidden h-[2px] w-full origin-left bg-accent transition-transform duration-500 ease-[var(--ease-out)] lg:block",
              active ? "scale-x-100" : "scale-x-0",
            )}
          />
          <span
            className={cn(
              "pt-2 font-mono text-xs tabular-nums transition-colors duration-300",
              expanded ? "text-accent" : "text-muted-subtle",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>
            <span
              className={cn(
                "block text-2xl font-medium leading-tight tracking-[-0.025em] text-foreground transition-colors duration-300 lg:text-[1.75rem]",
                !active &&
                  "lg:text-foreground/45 lg:group-hover:text-foreground/75",
              )}
            >
              {service.name}
            </span>
            <span
              className={cn(
                // Inside the h3, so reset its display face, weight and balanced wrapping.
                "mt-1.5 block max-w-sm font-sans text-sm font-normal leading-6 tracking-normal text-muted-foreground transition-colors duration-300 [text-wrap:pretty] lg:mt-2",
                !active && "lg:text-muted-subtle",
              )}
            >
              {service.summary}
            </span>
          </span>

          {/* Phones: a plus that turns into a minus while the row is open. */}
          <span
            aria-hidden="true"
            className="relative mt-3 block size-3.5 justify-self-end text-accent lg:hidden"
          >
            <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-current" />
            <span
              className={cn(
                "absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-current transition-transform duration-300",
                open && "scale-y-0",
              )}
            />
          </span>
          {/* Desktop: an arrow pointing to the panel. */}
          <span
            aria-hidden="true"
            className={cn(
              "hidden pt-1.5 text-lg transition-[color,transform,opacity] duration-500 ease-[var(--ease-out)] lg:block",
              active
                ? "translate-x-0 text-accent opacity-100"
                : "-translate-x-2 text-muted-subtle opacity-0 group-hover:opacity-100",
            )}
          >
            →
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="detail"
            id={detailId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            className="overflow-hidden lg:hidden"
          >
            <div className="pb-8 sm:pl-[3rem]">
              <div className="rounded-xl border border-border bg-surface/40 p-4 sm:p-6">
                <DrawnDiagram
                  service={service}
                  className="aspect-[560/380] h-auto"
                />
              </div>
              <div className="mt-6">
                <Stack service={service} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Desktop panel beside the list: the selected service's system diagram and stack. */
function Panel({ service, index }: { service: Service; index: number }) {
  const frameRef = React.useRef<HTMLDivElement>(null);

  // Cursor-tracked light along the frame's border.
  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!frame || event.pointerType !== "mouse") return;
    const bounds = frame.getBoundingClientRect();
    frame.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
    frame.style.setProperty("--my", `${event.clientY - bounds.top}px`);
  };
  const handleLeave = () => {
    frameRef.current?.style.setProperty("--mx", "-999px");
    frameRef.current?.style.setProperty("--my", "-999px");
  };

  return (
    <div
      ref={frameRef}
      id={PANEL_ID}
      role="region"
      aria-label={`${service.name}: system diagram and stack`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="relative hidden flex-col rounded-2xl border border-border bg-surface/50 lg:flex"
    >
      <span aria-hidden="true" className="border-light rounded-2xl" />

      <div className="flex items-center justify-between gap-6 border-b border-border px-6 py-4 font-mono text-xs">
        <div className="flex items-center gap-2 text-muted-subtle">
          <span>~/services</span>
          <span className="relative inline-grid overflow-hidden text-accent">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={service.id}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.35, ease }}
              >
                {service.path}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <span className="tabular-nums text-muted-subtle">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(COUNT).padStart(2, "0")}
        </span>
      </div>

      <div className="relative min-h-[20rem] flex-1">
        <AnimatePresence initial={false}>
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
            className="absolute inset-0 flex items-center justify-center p-8 xl:p-10"
          >
            <DrawnDiagram service={service} className="max-h-full" />
          </motion.div>
        </AnimatePresence>
        <p className="pointer-events-none absolute bottom-4 left-6 font-mono text-[11px] text-muted-subtle">
          hover a node to trace its connections
        </p>
      </div>

      <div className="relative flex min-h-[6.5rem] items-start gap-4 border-t border-border px-6 py-5">
        <span className="pt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-subtle">
          Stack
        </span>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={service.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Stack service={service} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stack({ service }: { service: Service }) {
  return (
    <ul
      className="flex flex-wrap gap-2"
      aria-label={`${service.name} technology stack`}
    >
      {service.tags.map((tag) => (
        <li
          key={tag}
          className="rounded-md border border-border-strong px-2.5 py-1 font-mono text-xs text-foreground/85 transition-colors duration-300 hover:border-accent/60 hover:text-accent"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

/** A system diagram that draws itself in each time it is shown. */
function DrawnDiagram({
  service,
  className,
}: {
  service: Service;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const progress = useMotionValue(shouldReduceMotion ? 1 : 0);

  React.useEffect(() => {
    if (shouldReduceMotion) {
      progress.set(1);
      return;
    }
    const controls = animate(progress, 1, {
      duration: 1.5,
      delay: 0.1,
      ease: [0.65, 0, 0.35, 1],
    });
    return () => controls.stop();
  }, [progress, shouldReduceMotion]);

  return (
    <SystemDiagram
      definition={service.diagram}
      progress={progress}
      className={className}
    />
  );
}
