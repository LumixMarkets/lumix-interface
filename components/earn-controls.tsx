"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useWallet } from "./wallet-provider";
import type { EarnSort } from "./earn-model";

const aprExplanation = "Estimated annual percentage rate from trading fees, using trading activity and deposits. It is an estimate, not a guaranteed return.";

export const earnMetricHelp: Partial<Record<EarnSort, string>> = {
  deposits: "Total value locked",
  apr: aprExplanation,
  performance: "The pool position’s return over the past 30 days, distinct from estimated fee APR.",
};

// Capsules borrow the rounded strokes of the Lumix mark; each is anchored to a banner edge so it crops cleanly at every width.
export function EarnOverviewArt() {
  return <div className="earn-overview-art" aria-hidden="true">
    <span className="earn-capsule earn-capsule--a" />
    <span className="earn-capsule earn-capsule--b" />
    <span className="earn-capsule earn-capsule--c" />
    <span className="earn-capsule earn-capsule--d" />
    <span className="earn-capsule earn-capsule--e" />
  </div>;
}

export function EarnWalletPrompt({ compact = false }: { compact?: boolean }) {
  const wallet = useWallet();
  const id = useId();
  return <section className={`earn-wallet-banner${compact ? " earn-wallet-banner--compact" : " earn-connect-banner"}`} aria-labelledby={`${id}-title`}>
    {!compact && <EarnOverviewArt />}
    <div className="earn-wallet-content"><h2 id={`${id}-title`}>Connect your wallet</h2>
      <p>Connect to view your deposits and fees earned.</p>
      <button className="trade-button trade-button--primary wallet-connect-button" type="button" disabled={!wallet.isReady || wallet.isConnecting} onClick={() => void wallet.connect()}>
        {wallet.isConnecting ? "Connecting…" : "Connect wallet"}
      </button>
    </div>
  </section>;
}

export function EarnAprText({ label, onSort, indicator }: { label: string; onSort?: () => void; indicator?: ReactNode }) {
  return <EarnMetricText label={label} explanation={aprExplanation} accessibleLabel={onSort ? "Sort by estimated APR" : "About estimated fee APR"}
    className="earn-apr-wrap" onSort={onSort} indicator={indicator} />;
}

export function EarnMetricText({ label, explanation, accessibleLabel, onSort, indicator, className = "" }: {
  label: string; explanation: string; accessibleLabel: string; onSort?: () => void; indicator?: ReactNode; className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const pinned = useRef(false);
  const holdTimer = useRef<number | undefined>(undefined);
  const suppressClick = useRef(false);
  function clearHold() { window.clearTimeout(holdTimer.current); holdTimer.current = undefined; }
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) {
        pinned.current = false;
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return <span ref={wrapperRef} className={`earn-info-wrap earn-metric-wrap ${className}`} onMouseLeave={(event) => {
    if (!pinned.current && !event.currentTarget.contains(document.activeElement)) setOpen(false);
  }}>
    <button type="button" className={onSort ? "earn-sort-button" : "earn-apr-trigger"}
      aria-label={accessibleLabel} aria-describedby={id}
      onFocus={() => setOpen(true)} onBlur={() => { clearHold(); pinned.current = false; suppressClick.current = false; setOpen(false); }}
      onPointerDown={(event) => {
        if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
        clearHold(); suppressClick.current = false;
        const trigger = event.currentTarget;
        holdTimer.current = window.setTimeout(() => { pinned.current = true; suppressClick.current = true; setOpen(true); trigger.focus({ preventScroll: true }); }, 500);
      }}
      onPointerUp={clearHold} onPointerCancel={() => { clearHold(); suppressClick.current = false; }}
      onContextMenu={(event) => { if (pinned.current) event.preventDefault(); }}
      onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        pinned.current = true; setOpen(true); onSort?.();
      }}
      onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); pinned.current = false; setOpen(false); } }}>
      {indicator}<span className="earn-column-label" onMouseEnter={() => setOpen(true)}>{label}</span>
    </button>
    <span className="earn-tooltip" role="tooltip" id={id} hidden={!open}>{explanation}</span>
  </span>;
}

export function EarnTabs<T extends string>({ id, label, value, options, onChange, disabled = false }: {
  id: string; label: string; value: T; options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void; disabled?: boolean;
}) {
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | undefined;
    if (event.key === "ArrowRight") next = (index + 1) % options.length;
    if (event.key === "ArrowLeft") next = (index + options.length - 1) % options.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = options.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    onChange(options[next].value);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
  }
  return (
    <div className="earn-tabs" role="tablist" aria-label={label}>
      {options.map((option, index) => <button key={option.value} id={`${id}-${option.value}-tab`} role="tab" type="button"
        aria-selected={value === option.value} aria-controls={`${id}-panel`} tabIndex={value === option.value ? 0 : -1}
        disabled={disabled} onClick={() => onChange(option.value)} onKeyDown={(event) => handleKey(event, index)}>{option.label}</button>)}
    </div>
  );
}

