"use client";

import { useCallback, useSyncExternalStore } from "react";
import { MOTION_KEY } from "./motion";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.dataset.motion === "reduced";
const getServerSnapshot = () => false;

/** Current motion mode (driven by the html[data-motion] attribute) and a persistent toggle. */
export function useReducedMotion(): { reduced: boolean; toggle: () => void } {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = document.documentElement.dataset.motion !== "reduced";
    document.documentElement.dataset.motion = next ? "reduced" : "full";
    try {
      if (next) localStorage.setItem(MOTION_KEY, "1");
      else localStorage.removeItem(MOTION_KEY);
    } catch {
      // storage unavailable: the choice lasts only for this page view
    }
  }, []);

  return { reduced, toggle };
}
