"use client";

import * as React from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";

import { FOLD_INSET, FOLD_RADIUS } from "@/components/motion/grow";
import { Magnetic } from "@/components/motion/magnetic";
import {
  PEEK_SVH,
  PIN_SCREENS,
  STOPS,
  statementAt,
  statements,
} from "@/components/sections/hero/data";
import {
  kernAfter,
  measureKerning,
  type Kerning,
} from "@/components/sections/hero/kerning";
import { useScrollStops } from "@/components/sections/hero/use-scroll-stops";
import { Button } from "@/components/ui/button";
import { goToContact } from "@/lib/contact";

type State = "before" | "active" | "after";
type Point = { x: number; y: number };

interface Kerns {
  statement: Kerning;
  name: Kerning;
}

const NAME = ["Root", "Path"] as const;

/** Statements behind the active one have rolled up and away; the ones after it wait below. */
function stateOf(index: number, active: number): State {
  if (index === active) return "active";
  return index < active ? "after" : "before";
}

/** A `.load-in` delay counted from the moment the hero starts its entrance. */
function afterIntro(seconds: number) {
  return {
    "--load-delay": `calc(var(--intro) + ${seconds}s)`,
  } as React.CSSProperties;
}

function typing(chars: number, duration: number, delay: number) {
  return {
    "--type-chars": chars,
    "--type-duration": `${duration}s`,
    "--type-delay": `${delay}s`,
  } as React.CSSProperties;
}

/**
 * Layout offset of `element` inside `ancestor`. Walks the offsetParent chain, because a word that
 * is mid-rise has a transform and so becomes the offsetParent of what is inside it.
 */
function offsetWithin(element: HTMLElement, ancestor: HTMLElement): Point {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** Each word as letters, numbered across the whole statement so the roll staggers left to right. */
function splitStatement(text: string) {
  let index = 0;
  return text
    .split(" ")
    .map((word) =>
      Array.from(word, (letter) => ({ letter, index: index++ })),
    );
}

/** First visit only: the brand command types itself out, then the curtain lifts off the page. */
function Boot() {
  return (
    <div
      aria-hidden="true"
      className="hero-boot fixed inset-0 z-[70] items-center justify-center bg-system-black px-6 text-off-white"
    >
      {/* Sized to the finished command, so it types from a fixed left edge instead of re-centring. */}
      <p className="hero-boot-inner w-[29ch] max-w-full font-mono text-[clamp(1.05rem,2.4vw,1.6rem)] leading-[1.15]">
        <span className="hero-type font-bold" style={typing(4, 0.28, 0.2)}>
          &gt;<span className="text-brand-green-light">_</span>rp
        </span>
        <span className="hero-type text-off-white/55" style={typing(24, 0.55, 0.62)}>
          $ start --build --beyond
        </span>
        <span className="hero-boot-cursor text-brand-green-light" />
      </p>
    </div>
  );
}

/**
 * One statement as masked words of rolling letters. Memoised: a step only changes the `state` of
 * two statements, and the caret's own updates should not rebuild every letter.
 */
const Statement = React.memo(function Statement({
  text,
  state,
  rise,
  kerning,
}: {
  text: string;
  state: State;
  /** Rises into place on load. Only the first statement is on screen then. */
  rise: boolean;
  kerning: Kerning | null;
}) {
  const words = React.useMemo(() => splitStatement(text), [text]);

  return (
    <span className="hero-phrase block" data-state={state} aria-hidden="true">
      {words.map((letters, w) => {
        const last = w === words.length - 1;
        return (
          <React.Fragment key={w}>
            <span className="hero-word" data-last={last ? "" : undefined}>
              <span
                className="hero-rise"
                data-rise={rise ? "" : undefined}
                style={
                  { "--rise-delay": `${0.2 + w * 0.08}s` } as React.CSSProperties
                }
              >
                {letters.map(({ letter, index }, l) => (
                  <span
                    key={index}
                    className="hero-char"
                    style={
                      {
                        "--i": index,
                        ...kernAfter(kerning, letter, letters[l + 1]?.letter),
                      } as React.CSSProperties
                    }
                  >
                    {letter}
                  </span>
                ))}
                {/* Marks where the line ends (on its baseline) for the caret to travel to. */}
                {last ? (
                  <span data-end="" className="inline-block h-0 w-0" />
                ) : null}
              </span>
            </span>
            {/* Phones set each statement on two lines; it would be too small on one. */}
            {last ? null : (
              <>
                {" "}
                <br className="sm:hidden" />
              </>
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
});

/** The name, with the brand-green bar for its hyphen. Its letters rise one after another. */
const Name = React.memo(function Name({
  kerning,
  ref,
}: {
  kerning: Kerning | null;
  ref?: React.Ref<HTMLParagraphElement>;
}) {
  return (
    <p ref={ref} aria-hidden="true" className="hero-name">
      {NAME.map((word, w) => (
        <React.Fragment key={word}>
          {w > 0 ? (
            <span
              className="hero-name-letter hero-name-dash"
              style={{ "--i": 4 } as React.CSSProperties}
            />
          ) : null}
          {Array.from(word, (letter, l) => (
            <span
              key={l}
              className="hero-name-letter"
              style={
                {
                  "--i": w * 5 + l,
                  ...kernAfter(kerning, letter, word[l + 1]),
                } as React.CSSProperties
              }
            >
              {letter}
            </span>
          ))}
        </React.Fragment>
      ))}
    </p>
  );
});

/**
 * A pinned, scroll-driven statement. The page boots like a terminal on the first visit, the
 * curtain lifts, and the three statements roll through one after another as the visitor scrolls,
 * the scroll resting on each one so it can be read.
 */
export function Hero() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const slotRef = React.useRef<HTMLDivElement>(null);
  const nameRef = React.useRef<HTMLParagraphElement>(null);
  const caretRef = React.useRef<HTMLSpanElement>(null);

  const [active, setActive] = React.useState(0);
  const [kerns, setKerns] = React.useState<Kerns | null>(null);
  const [ends, setEnds] = React.useState<Point[] | null>(null);
  const [caretReady, setCaretReady] = React.useState(false);
  const [caretMoving, setCaretMoving] = React.useState(true);

  // 0 when the hero's top meets the top of the viewport, 1 when the pin lets go.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  // 0 when the pin lets go, 1 once the hero has scrolled off the top.
  const { scrollYProgress: leave } = useScroll({
    target: sectionRef,
    offset: ["end end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = statementAt(progress * PIN_SCREENS);
    setActive((current) => (current === next ? current : next));
  });

  useScrollStops(sectionRef, STOPS);

  // A reload part-way down the hero restores the scroll position without a change event.
  React.useEffect(() => {
    setActive(statementAt(scrollYProgress.get() * PIN_SCREENS));
  }, [scrollYProgress]);

  const exit = useTransform(
    leave,
    (progress) =>
      `translate3d(0, ${(progress * 30).toFixed(2)}svh, 0) scale(${(1 - progress * 0.06).toFixed(4)})`,
  );
  const exitOpacity = useTransform(leave, [0, 1], [1, 0.3]);

  // Kerning is measured once the display font is in, so split letters sit as the font intends.
  React.useEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (cancelled || !slotRef.current || !nameRef.current) return;
      setKerns({
        statement: measureKerning(
          slotRef.current,
          statements.flatMap((statement) => statement.text.split(" ")),
        ),
        name: measureKerning(nameRef.current, NAME),
      });
    };
    if (document.fonts) document.fonts.ready.then(measure);
    else measure();
    return () => {
      cancelled = true;
    };
  }, []);

  // Where each statement ends, for the caret. Measured from layout, so the rolling letters and
  // rising words never skew it.
  React.useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const measure = () => {
      const anchors = slot.querySelectorAll<HTMLElement>("[data-end]");
      setEnds(Array.from(anchors, (anchor) => offsetWithin(anchor, slot)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => observer.disconnect();
  }, [kerns]);

  // The caret shows once it has a settled position, so it never flies in from the corner.
  React.useEffect(() => {
    if (!kerns || !ends || caretReady) return;
    const frame = requestAnimationFrame(() => setCaretReady(true));
    return () => cancelAnimationFrame(frame);
  }, [kerns, ends, caretReady]);

  // Solid while the caret travels to a new statement, blinking again once it rests. How long the
  // glide takes is read from its CSS transition, so the two never drift apart.
  React.useEffect(() => {
    const element = caretRef.current;
    if (!element) return;
    const style = getComputedStyle(element);
    const glideMs =
      (Number.parseFloat(style.transitionDuration) +
        Number.parseFloat(style.transitionDelay)) *
      1000;
    setCaretMoving(true);
    const timer = window.setTimeout(() => setCaretMoving(false), glideMs);
    return () => window.clearTimeout(timer);
  }, [active]);

  const caret = ends?.[active];

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-labelledby="hero-heading"
      // Pulled up under the navbar's 58px in-flow height, so the pinned stage fills the first
      // screen exactly; the stage's own top padding keeps the content clear of the bar.
      // The Services band overlaps the end of the hero by the peek height; see PEEK_SVH.
      className="relative -mt-[58px]"
      style={{
        height: `${(PIN_SCREENS + 1) * 100}svh`,
        marginBottom: `-${PEEK_SVH}svh`,
      }}
    >
      <Boot />
      <h1 id="hero-heading" className="sr-only">
        Root-Path: web, mobile &amp; cloud engineering. Small team. Direct
        access. Faster decisions.
      </h1>

      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div
          // Reduced motion: held in place in CSS (.hero-light).
          style={{ transform: exit, opacity: exitOpacity }}
          className="hero-light absolute inset-0 origin-top"
        >
          {/* Top padding clears the floating navbar (16px offset + 58px bar); the bottom padding
              clears the band peeking up from below and lifts the column to the optical centre. */}
          <div
            className="@container mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6 pt-[4.625rem] text-center lg:px-10"
            style={{ paddingBottom: `calc(${PEEK_SVH}svh + max(1.5rem, 4svh))` }}
          >
            <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:gap-5">
              <Name ref={nameRef} kerning={kerns?.name ?? null} />
              <span
                aria-hidden="true"
                className="load-in hidden h-5 w-px bg-border-strong sm:block"
                style={afterIntro(0.3)}
              />
              <p
                className="load-in font-mono text-[11px] uppercase tracking-[0.2em] text-muted-subtle"
                style={afterIntro(0.35)}
              >
                Web, mobile &amp; cloud engineering
              </p>
            </div>

            <div
              ref={slotRef}
              className="hero-slot hero-statement mt-[max(1.75rem,5svh)] w-full text-foreground"
            >
              {statements.map((statement, index) => (
                <Statement
                  key={statement.text}
                  text={statement.text}
                  state={stateOf(index, active)}
                  rise={index === 0}
                  kerning={kerns?.statement ?? null}
                />
              ))}
              <span
                ref={caretRef}
                aria-hidden="true"
                className="hero-cursor"
                data-ready={caretReady && caret ? "" : undefined}
                data-moving={caretMoving ? "" : undefined}
                style={
                  caret
                    ? {
                        transform: `translate3d(${caret.x}px, ${caret.y}px, 0) translate(0.07em, 0.03em)`,
                      }
                    : undefined
                }
              >
                <span />
              </span>
            </div>

            <div
              className="load-in mt-[max(1.5rem,4.5svh)] grid max-w-[31rem]"
              style={afterIntro(0.5)}
            >
              {statements.map((statement, index) => (
                <p
                  key={statement.text}
                  data-state={stateOf(index, active)}
                  className="hero-caption text-balance text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
                >
                  {statement.caption}
                </p>
              ))}
            </div>

            <div
              className="load-in mt-[max(1.5rem,4.5svh)]"
              style={afterIntro(0.6)}
            >
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
          </div>
        </motion.div>

        {/* The folded top of the Services band, shown the whole time the hero is pinned so it is
            clear there is more below. The real band lands on it exactly when the pin lets go. */}
        <a
          href="#services"
          tabIndex={-1}
          aria-hidden="true"
          data-surface="inverse"
          className="hero-peek absolute bottom-0"
          style={
            {
              height: `${PEEK_SVH}svh`,
              "--fold-inset": `${FOLD_INSET}%`,
              "--fold-radius": FOLD_RADIUS,
            } as React.CSSProperties
          }
        />
      </div>
    </section>
  );
}
