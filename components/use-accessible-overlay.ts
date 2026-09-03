"use client";

import { type RefObject, useEffect } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useAccessibleOverlay(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const container = containerRef.current;
    const appShell = document.querySelector<HTMLElement>(".trade-app-shell");
    if (!open || !container || !appShell) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    appShell.inert = true;
    appShell.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "hidden";

    const focusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => !element.hidden);
    window.requestAnimationFrame(() => focusable()[0]?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      appShell.inert = false;
      appShell.removeAttribute("aria-hidden");
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [containerRef, onClose, open]);
}
