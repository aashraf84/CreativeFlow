"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * AnimatedCounter — smoothly counts from 0 to `value` over ~1 second
 * with an ease-out curve so it slows down near the end.
 *
 * - Uses `requestAnimationFrame` for smooth, jank-free animation.
 * - Formats the current value with `Intl.NumberFormat` so thousands
 *   separators are applied during the animation.
 * - When `value` changes after the initial run, it re-animates from
 *   the previously displayed number to the new target.
 */
export interface AnimatedCounterProps {
  /** Final number to count up to. */
  value: number;
  /** Total animation duration in milliseconds (default 1000). */
  duration?: number;
  /** Optional prefix string (e.g. "$"). */
  prefix?: string;
  /** Optional suffix string (e.g. "%"). */
  suffix?: string;
  /** Number of decimal places to display (default 0). */
  decimals?: number;
  /** Locale used by Intl.NumberFormat (default "en-US"). */
  locale?: string;
  /** className applied to the rendered <span>. */
  className?: string;
}

// ease-out cubic: fast start, slow end
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale = "en-US",
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  // Keep a ref of the current "from" value so subsequent changes animate from
  // the previously displayed number rather than snapping back to 0.
  const fromRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number.isFinite(value) ? value : 0;
    const delta = to - from;

    startRef.current = null;

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = duration <= 0 ? 1 : Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = from + delta * eased;

      // Update state inside the rAF callback (this is NOT a sync effect call)
      setDisplayValue(current);
      fromRef.current = current;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Ensure we land exactly on the target value
        setDisplayValue(to);
        fromRef.current = to;
        rafRef.current = null;
      }
    };

    // Always schedule a frame — even when delta is 0, this avoids calling
    // setState synchronously inside the effect body (which would trigger
    // the React "set-state-in-effect" warning). The first tick will land
    // on the target immediately when delta is 0.
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, duration, decimals, locale]);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue);

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default AnimatedCounter;
