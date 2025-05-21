import { useRef, useEffect } from "react";
import { useIsMobile } from "./use-mobile";

const EDGE_THRESHOLD = 20; // px from the left edge to start swipe
const SWIPE_THRESHOLD = 50; // distance required to trigger

/**
 * Detects a swipe from the left edge of the screen on mobile devices and
 * invokes the provided callback.
 */
export function useEdgeSwipe(onSwipe: () => void) {
  const isMobile = useIsMobile();
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.touches[0].clientX < EDGE_THRESHOLD) {
        startX.current = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startX.current !== null) {
        const deltaX = e.touches[0].clientX - startX.current;
        if (deltaX > SWIPE_THRESHOLD) {
          onSwipe();
          startX.current = null;
        }
      }
    };

    const handleTouchEnd = () => {
      startX.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipe, isMobile]);
}
