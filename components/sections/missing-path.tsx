"use client";

import * as React from "react";

/** The path that was asked for, as a terminal line. Read after mount: the 404 page is static. */
export function MissingPath() {
  const [path, setPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPath(decodeURIComponent(window.location.pathname));
  }, []);

  return (
    <p className="mt-8 font-mono text-sm leading-6 text-muted-foreground">
      <span className="text-accent">&gt;</span> cd{" "}
      <span className="break-all text-foreground">{path ?? "…"}</span>
      <br />
      <span className="text-muted-subtle">no such route</span>
    </p>
  );
}
