"use client";

import { useEffect, useState } from "react";
import { formatDayLine } from "@/lib/format";

/**
 * Rendered client-side only. A server-rendered clock would be wrong the moment
 * the page is cached, and this page is cached aggressively.
 */
export default function LiveClock() {
  const [stamp, setStamp] = useState<string>("");

  useEffect(() => {
    const tick = () => setStamp(formatDayLine());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Reserve the row height so the bar does not jump when the clock arrives.
  return <span className="min-h-4 truncate">{stamp || " "}</span>;
}
