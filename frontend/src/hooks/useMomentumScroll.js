import { useEffect } from 'react';
import Lenis from 'lenis';

// Single shared instance so navigation code can drive the same smooth scroller.
let lenisInstance = null;
export const getLenis = () => lenisInstance;

const prefersReduced = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Premium momentum scrolling via Lenis (the Francois0203 feel).
 * - Desktop: smooths the wheel for weighty, inertial scrolling.
 * - Touch: left on native scroll so mobile keeps its own momentum.
 * - Disabled entirely when the visitor prefers reduced motion.
 */
export default function useMomentumScroll() {
  useEffect(() => {
    if (typeof window === 'undefined' || prefersReduced()) return undefined;

    const lenis = new Lenis({
      lerp: 0.075,
      smoothWheel: true,
      wheelMultiplier: 1.25,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;

    let rafId = 0;
    const raf = (time) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = null;
    };
  }, []);
}
