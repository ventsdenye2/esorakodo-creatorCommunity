"use client";

import { useEffect } from "react";

const targets = "[data-motion], [data-motion-group] > *";

/** Progressive enhancement: server-rendered content never depends on animation. */
export function CampusMotion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const active = new Map<HTMLElement, Animation>();
    let stopWatching = () => {};

    function startWatching() {
      if (preference.matches || !window.IntersectionObserver || !Element.prototype.animate) return;
      const watching = new Set<HTMLElement>();
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          observer.unobserve(element);
          watching.delete(element);
          seen.add(element);
          // Restored scroll positions and keyboard navigation take precedence.
          if (entry.boundingClientRect.top < 0 || element.contains(document.activeElement)) continue;
          const group = element.parentElement?.hasAttribute("data-motion-group");
          const index = group ? Array.from(element.parentElement!.children).indexOf(element) : 0;
          const isView = element.dataset.motion === "view";
          const animation = element.animate(
            [
              { opacity: 0, translate: `0 ${isView ? 22 : 16}px`, ...(isView ? { scale: ".985" } : {}) },
              { opacity: 1, translate: "0 0", ...(isView ? { scale: "1" } : {}) },
            ],
            { duration: isView ? 760 : 520, delay: Math.min(index, 4) * 65, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "backwards" },
          );
          active.set(element, animation);
          animation.finished.then(() => active.delete(element), () => active.delete(element));
        }
      }, { threshold: .08, rootMargin: "0px 0px -24px 0px" });

      function register(root: Element) {
        const elements = [...(root.matches(targets) ? [root] : []), ...root.querySelectorAll(targets)];
        for (const element of elements) {
          if (!(element instanceof HTMLElement) || seen.has(element) || watching.has(element)) continue;
          watching.add(element);
          observer.observe(element);
        }
      }

      register(document.body);
      // Includes streamed Server Components and client-side route/filter changes.
      const mutations = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) if (node instanceof Element) register(node);
        }
        for (const element of watching) {
          if (!element.isConnected) { observer.unobserve(element); watching.delete(element); }
        }
        for (const [element, animation] of active) if (!element.isConnected) animation.cancel();
      });
      mutations.observe(document.body, { childList: true, subtree: true });
      stopWatching = () => { observer.disconnect(); mutations.disconnect(); };
    }

    function syncPreference() {
      stopWatching();
      for (const animation of active.values()) animation.cancel();
      active.clear();
      startWatching();
    }

    function revealFocus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      for (const [element, animation] of active) if (element.contains(event.target)) animation.cancel();
    }

    startWatching();
    preference.addEventListener("change", syncPreference);
    document.addEventListener("focusin", revealFocus);
    return () => {
      stopWatching();
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("focusin", revealFocus);
      for (const animation of active.values()) animation.cancel();
    };
  }, []);

  return null;
}
