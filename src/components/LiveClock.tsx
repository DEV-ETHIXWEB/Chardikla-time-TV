"use client";

import { useEffect, useState } from "react";
import { formatDayLine } from "@/lib/format";

/**
 * Date and running clock in the masthead, in IST.
 *
 * Client-only on purpose: a server-rendered clock is wrong the moment the page
 * is cached, and these pages are cached hard. The markup reserves its height
 * so the bar does not jump when the time arrives after hydration.
 */
export default function LiveClock() {
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setDay(formatDayLine());
      try {
        // en-GB is used for the numerals and then rendered beside Punjabi text;
        // Chromium has no `pa` locale data, so asking for it yields "M10 4".
        setTime(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
            .format(new Date())
            .toUpperCase(),
        );
      } catch {
        setTime("");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="flex min-h-4 items-center gap-2 truncate">
      <span className="truncate">{day || " "}</span>
      {time && (
        <>
          <span aria-hidden="true" className="text-white/60">
            |
          </span>
          <time className="tabular-nums text-white/90" suppressHydrationWarning>
            {time}
          </time>
          <span className="hidden text-white/75 xs:inline">IST</span>
        </>
      )}
    </span>
  );
}
