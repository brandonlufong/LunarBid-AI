// Landing-page motion with no dependencies: IntersectionObserver reveals, a compact header on
// scroll, and a small parallax on the product visual. Everything is skipped when the user
// prefers reduced motion (content is then simply visible).
import { useEffect, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reveal = (el) => el.classList.add('is-visible');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      root.querySelectorAll('[data-reveal]').forEach(reveal);
      // Content added later (e.g. pricing loaded from the API) must be visible too.
      const mo = new MutationObserver(() => root.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(reveal));
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    root.classList.add('motion-ready');
    let settled = false; // after the safety delay, new content is shown immediately
    // Reveal as soon as an element's top edge is a little way into the viewport
    // (threshold 0 so tall blocks, like the FAQ, don't wait until 12% of them is on screen).
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    // Tracked per effect run (not on the element): React Strict Mode runs effects twice in
    // development, and a flag left on the element by the discarded first run would stop the
    // second run from observing anything.
    const watched = new WeakSet();
    const watch = (el) => {
      if (watched.has(el) || el.classList.contains('is-visible')) return;
      watched.add(el);
      if (settled) reveal(el); else io.observe(el);
    };
    root.querySelectorAll('[data-reveal]').forEach(watch);
    // Elements rendered after mount (async data) are observed as they appear.
    const mo = new MutationObserver(() => root.querySelectorAll('[data-reveal]').forEach(watch));
    mo.observe(root, { childList: true, subtree: true });
    // Safety net: never leave content hidden (print, anchor jumps, very tall screens).
    const fallback = setTimeout(() => { settled = true; root.querySelectorAll('[data-reveal]').forEach(reveal); }, 4000);
    return () => { io.disconnect(); mo.disconnect(); clearTimeout(fallback); };
  }, [rootRef]);
}

export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [threshold]);
  return scrolled;
}

/** Moves an element slightly as it scrolls past (desktop only, rAF-throttled). */
export function useParallax(ref, strength = 0.06) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || window.matchMedia('(max-width: 1023px)').matches) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - window.innerHeight / 2) * -strength;
      el.style.transform = `translate3d(0, ${Math.max(-24, Math.min(24, offset)).toFixed(1)}px, 0)`;
    };
    const on = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(frame); };
  }, [ref, strength]);
}