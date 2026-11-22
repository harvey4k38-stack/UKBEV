import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenis: Lenis | null = null;

/**
 * Site-wide inertial wheel scrolling (desktop). Touch devices keep native scrolling,
 * which already has momentum and is the fastest option on phones.
 */
export function initSmoothScroll() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: true });
}

export function scrollToTop(smooth: boolean) {
  if (lenis) {
    lenis.scrollTo(0, { immediate: !smooth });
  } else {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }
}
