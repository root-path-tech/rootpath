"use client";

import * as React from "react";

/** Live result of a media query; false during server render and first paint. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/**
 * Whether the visitor prefers reduced motion. Like useMediaQuery, it is false during server
 * render and hydration, so the first client render always matches the server HTML; the real
 * preference applies straight after. Use this rather than motion's useReducedMotion, which
 * reads the preference during hydration and makes the page fail to hydrate for these visitors.
 * Scroll-linked and entrance styles are settled for them in CSS instead (globals.css).
 */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
