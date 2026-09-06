"use client";

import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icon";

// Shared dropdown behavior extracted from the app's asset-pair selector.
export function AssetDropdown<Value extends string>({
  id, label, value, options, selectedContent, onChange, disabled = false,
  className, menuClassName = "", matchTriggerWidth = false, optionHeight = 48,
}: {
  id?: string;
  label: string;
  value: Value;
  options: readonly { value: Value; label: string; content: ReactNode }[];
  selectedContent: ReactNode;
  onChange: (value: Value) => void;
  disabled?: boolean;
  className: string;
  menuClassName?: string;
  matchTriggerWidth?: boolean;
  optionHeight?: number;
}) {
  const listboxId = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 8;
    const idealHeight = options.length * optionHeight + 8;
    const width = Math.min(matchTriggerWidth ? rect.width : 288, window.innerWidth - viewportPadding * 2);
    const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const spaceAbove = rect.top - gap - viewportPadding;
    const openAbove = spaceBelow < idealHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.min(idealHeight, Math.max(96, openAbove ? spaceAbove : spaceBelow));
    const top = openAbove ? Math.max(viewportPadding, rect.top - gap - maxHeight) : rect.bottom + gap;
    setMenuStyle({ top, left, width, maxHeight });
  }, [matchTriggerWidth, optionHeight, options.length]);

  const closeMenu = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open || disabled) return;
    updateMenuPosition();
    const focusFrame = window.requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus());
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMenu(true);
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) closeMenu();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [activeIndex, closeMenu, disabled, open, updateMenuPosition]);

  function openMenu() {
    if (disabled) return;
    setActiveIndex(selectedIndex);
    updateMenuPosition();
    setOpen(true);
  }
  function choose(next: Value) { onChange(next); closeMenu(true); }
  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(options[index].value);
      return;
    }
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (event.key === "Tab") {
      closeMenu();
      // Continue tab order from the trigger, rather than the portalled menu.
      triggerRef.current?.focus();
    }
    if (nextIndex === null) return;
    event.preventDefault();
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  return <>
    <button id={id} ref={triggerRef} className={className} type="button" disabled={disabled}
      aria-label={`${label}: ${options[selectedIndex].label}`} aria-controls={listboxId} aria-expanded={open && !disabled} aria-haspopup="listbox"
      onClick={() => open ? closeMenu() : openMenu()}
      onKeyDown={(event) => {
        if (event.key === "Tab" && open) { closeMenu(); return; }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault(); openMenu();
      }}>
      {selectedContent}<Icon name="chevron-down" size={14} />
    </button>
    {open && !disabled && menuStyle && createPortal(
      <div ref={menuRef} className={`asset-select-menu ${menuClassName}`} id={listboxId} role="listbox" aria-label={label} style={menuStyle}>
        {options.map((option, index) => <button key={option.value} ref={(element) => { optionRefs.current[index] = element; }}
          className="asset-select-option" type="button" role="option" aria-label={option.label} aria-selected={option.value === value}
          tabIndex={index === activeIndex ? 0 : -1} onClick={() => choose(option.value)} onKeyDown={(event) => handleOptionKeyDown(event, index)}>
          {option.content}{option.value === value && <Icon name="check" size={15} />}
        </button>)}
      </div>, document.body,
    )}
  </>;
}
