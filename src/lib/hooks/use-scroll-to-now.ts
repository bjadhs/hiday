import { useEffect } from 'react';
import { HOUR_HEIGHT } from '@/components/timeline/constants';

const MAX_ATTEMPTS = 30; // ~0.5s worth of frames

/**
 * Scrolls the given container so the current time sits in the vertical middle
 * of the viewport. When `enabled` is false (not viewing today) it resets to top.
 * Runs on mount and whenever the day or enabled flag changes — NOT every tick,
 * so it never yanks the user's manual scroll position.
 *
 * Retries across animation frames until the container is actually mounted and
 * bounded (scrollHeight > clientHeight). Otherwise the read can happen while the
 * flex layout is still settling — clientHeight is 0 or the full content height —
 * and the centering math collapses to the top of the timeline.
 */
export function useScrollToNow(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  startOfDay: number,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      return;
    }

    let raf = 0;
    let attempts = 0;

    const tryCenter = () => {
      const container = scrollContainerRef.current;
      const viewport = container?.clientHeight ?? 0;

      // Wait until the container exists and is bounded (i.e. actually scrollable).
      if (!container || viewport <= 0 || container.scrollHeight <= viewport) {
        if (attempts++ < MAX_ATTEMPTS) raf = requestAnimationFrame(tryCenter);
        return;
      }

      const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
      const nowTop = (Date.now() - startOfDay) / msPerPixel;
      container.scrollTop = Math.max(0, nowTop - viewport / 2);
    };

    raf = requestAnimationFrame(tryCenter);
    return () => cancelAnimationFrame(raf);
  }, [scrollContainerRef, startOfDay, enabled]);
}
