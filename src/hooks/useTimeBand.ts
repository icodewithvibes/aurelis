/**
 * useTimeBand — the current time-of-day band, kept honest while the app
 * stays open. Re-checks when the band's boundary passes and whenever the
 * tab is shown again (phones suspend timers aggressively).
 */
import { useEffect, useState } from "react";
import { bandForDate, msUntilNextBand, type TimeBand } from "../lib/timeOfDay";

export function useTimeBand(): TimeBand {
  const [band, setBand] = useState<TimeBand>(() => bandForDate());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      setBand(bandForDate());
      // +1s so the timer lands inside the new band, never on its edge.
      timer = setTimeout(schedule, msUntilNextBand() + 1000);
    };
    schedule();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        schedule();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return band;
}
