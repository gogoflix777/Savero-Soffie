/**
 * Smooth Scroll Utility using Lenis when available, with standard native fallback.
 */

export const scrollToTop = (smooth = true) => {
  if (typeof window === 'undefined') return;
  if (window.__lenis) {
    window.__lenis.scrollTo(0, {
      immediate: !smooth,
      duration: smooth ? 0.9 : 0,
      lock: false
    });
  } else {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior)
    });
  }
};

export const scrollToElement = (target: string | HTMLElement, offset = -75, smooth = true) => {
  if (typeof window === 'undefined') return;
  if (window.__lenis) {
    window.__lenis.scrollTo(target, {
      offset,
      immediate: !smooth,
      duration: smooth ? 1.05 : 0
    });
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({
        top,
        behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior)
      });
    }
  }
};

