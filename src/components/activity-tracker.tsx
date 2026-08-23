"use client";

import { useEffect, useRef } from "react";
import { touchLastLogin } from "@/lib/actions/activity";

/** Consider the user inactive after this long without focus / visibility. */
const INACTIVITY_MS = 2 * 60 * 1000;

/**
 * Updates last login when the user returns to the app after being away
 * (hidden tab, blurred window, or idle).
 */
export function ActivityTracker() {
  const inactiveSince = useRef<number | null>(null);
  const lastTouchAt = useRef(0);

  useEffect(() => {
    async function markReturn() {
      const now = Date.now();
      if (now - lastTouchAt.current < 15_000) return;
      lastTouchAt.current = now;
      try {
        await touchLastLogin();
      } catch {
        // Ignore network / auth blips; next return will retry.
      }
    }

    function goInactive() {
      if (inactiveSince.current === null) {
        inactiveSince.current = Date.now();
      }
    }

    function goActive() {
      const started = inactiveSince.current;
      inactiveSince.current = null;
      if (started !== null && Date.now() - started >= INACTIVITY_MS) {
        void markReturn();
      }
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        goInactive();
      } else {
        goActive();
      }
    }

    void markReturn();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", goInactive);
    window.addEventListener("focus", goActive);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", goInactive);
      window.removeEventListener("focus", goActive);
    };
  }, []);

  return null;
}
