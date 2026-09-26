"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./icon";
import { AssetDropdown } from "./asset-dropdown";
import { EarnTokenIcon } from "./earn-token-icon";
import { useEarn } from "./earn-provider";
import { useWallet } from "./wallet-provider";
import {
  EARN_ASSETS, USD_SCALE, earnAmountInput, earnAssetValue, earnAvailableAmount, earnPositionValue,
  formatEarnAmount, formatEarnUsd, parseEarnAmount, validateEarnDraft,
  type EarnAssetId, type EarnMode, type EarnPool,
} from "./earn-model";

const ZERO = BigInt(0);

export function EarnTradePanel({ pool }: { pool: EarnPool }) {
  const wallet = useWallet();
  const connected = wallet.isAuthenticated;
  const { state, loading, pending, submit: submitAction } = useEarn();
  const id = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [sticky, setSticky] = useState(false);
  const [mode, setMode] = useState<EarnMode>("deposit");
  const [asset, setAsset] = useState<EarnAssetId>(pool.assets[1]);
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const mounted = useRef(true);
  const submissionLock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => {
      const header = document.querySelector(".trade-app-header")?.getBoundingClientRect().height ?? 72;
      panel.style.setProperty("--earn-sticky-offset", `${header + 24}px`);
      setSticky(window.innerWidth >= 1024 && panel.offsetHeight <= window.innerHeight - header - 48);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    const header = document.querySelector(".trade-app-header");
    if (header) observer.observe(header);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const draft = { poolId: pool.id, asset, mode, amount };
  const validation = connected ? validateEarnDraft(state, draft) : parseEarnAmount(amount, asset);
  const available = connected ? earnAvailableAmount(state, draft) : ZERO;
  const error = !validation.ok && (touched || amount !== "") ? validation.message : "";
  const actionValue = validation.ok ? earnAssetValue(validation.units, asset) : ZERO;
  const position = connected ? earnPositionValue(state, pool.id) : ZERO;
  const positionAfter = position + (mode === "deposit" ? actionValue : -actionValue);
  const balanceAfter = connected && validation.ok ? state.balances[asset] + (mode === "deposit" ? -validation.units : validation.units) : ZERO;
  const feesEarned = connected ? (state.positions[pool.id]?.feesEarnedCents ?? ZERO) * USD_SCALE / BigInt(100) : ZERO;
  const verb = mode === "deposit" ? "Buy" : "Sell";
  const busy = loading || pending;
  const actionAmount = validation.ok ? validation.units : ZERO;

  function resetForm() { setAmount(""); setTouched(false); setFeedback(null); }
  async function submit() {
    if (!connected || busy || submissionLock.current) return;
    setTouched(true);
    if (!validation.ok) return;
    submissionLock.current = true;
    setFeedback(null);
    const result = await submitAction(draft);
    submissionLock.current = false;
    if (!mounted.current) return;
    if (result.ok) { setAmount(""); setTouched(false); }
    setFeedback(result);
  }

  return <aside id="pool-action" ref={panelRef} className={`trade-panel earn-trade-panel${sticky ? " is-sticky" : ""}`} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Manage position</h2>
    <form className="earn-management-form" onSubmit={(event) => { event.preventDefault(); void submit(); }} noValidate aria-label="Buy or sell pool assets">
      <div className="trade-segmented option-order-side-toggle" role="group" aria-label="Order side">
        <button type="button" aria-pressed={mode === "deposit"} disabled={busy} onClick={() => { setMode("deposit"); resetForm(); }}>Buy</button>
        <button type="button" aria-pressed={mode === "withdraw"} disabled={busy} onClick={() => { setMode("withdraw"); resetForm(); }}>Sell</button>
      </div>
      <div aria-busy={busy}>
        <fieldset disabled={busy}>
          <legend className="earn-sr-only">{verb} one pool asset</legend>
          <label className="earn-field-label" htmlFor={`${id}-asset`}>Asset</label>
          <AssetDropdown id={`${id}-asset`} label="Asset" value={asset} disabled={busy}
            className="options-pair-trigger options-pair-trigger--segmented earn-asset-select"
            menuClassName="options-pair-menu options-pair-menu--segmented earn-asset-menu" matchTriggerWidth optionHeight={64}
            selectedContent={<span className="earn-selected-asset"><EarnTokenIcon asset={asset} /><span className="asset-select-option-copy"><strong>{asset}</strong><span>{EARN_ASSETS[asset].name}</span></span></span>}
            options={pool.assets.map((option) => ({ value: option, label: `${EARN_ASSETS[option].name} (${option})`,
              content: <><EarnTokenIcon asset={option} /><span className="asset-select-option-copy"><strong>{option}</strong><span>{EARN_ASSETS[option].name}</span></span></>,
            }))}
            onChange={(next) => { setAsset(next); resetForm(); }} />
          <div className={`asset-amount-card earn-amount-card${error ? " is-error" : ""}`}>
            <div className="amount-card-meta"><label htmlFor={`${id}-amount`} className="amount-card-label">Amount</label>
              {connected && <button className="earn-max" type="button" disabled={busy || available === ZERO} onClick={() => { setAmount(earnAmountInput(available, asset)); setTouched(true); setFeedback(null); }}>Max</button>}
            </div>
            <input className="amount-input earn-amount-input" id={`${id}-amount`} aria-label={`Amount in ${asset}`}
              value={amount} placeholder="0.00" inputMode="decimal" autoComplete="off" spellCheck={false} maxLength={96}
              aria-invalid={Boolean(error)} aria-describedby={[connected ? `${id}-available` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
              onBlur={() => setTouched(true)} onChange={(event) => { setAmount(event.target.value); setFeedback(null); }} />
            <div className="amount-card-footer"><span>{formatEarnUsd(actionValue)}</span><span>{asset}</span></div>
          </div>
          {connected && <div className="earn-available" id={`${id}-available`}><span>{mode === "deposit" ? "Available balance" : "Available to sell"}</span><strong data-testid="available-balance">{formatEarnAmount(available, asset)} {asset}</strong></div>}
          {error && <p className="earn-error" id={`${id}-error`} role="alert">{error}</p>}
          {connected && mode === "withdraw" && available === ZERO && !error && <p className="earn-form-note">No {asset} supplied yet. Choose the other asset or buy first.</p>}
          <div className="earn-receive-preview"><span>{mode === "deposit" ? "Position added" : "Assets received"}</span><strong>{mode === "deposit" ? formatEarnUsd(actionValue) : `${formatEarnAmount(actionAmount, asset)} ${asset}`}</strong></div>
        </fieldset>
        {connected && <div className="earn-feedback" aria-live="polite" aria-atomic="true">
          {pending ? <p className="earn-processing"><span className="earn-spinner" />Processing…</p> : feedback && <p className={feedback.ok ? "earn-success" : "earn-error"}>{feedback.ok && <Icon name="check" size={16} />}<span>{feedback.message}</span></p>}
        </div>}
        {connected ? <button className="trade-button trade-button--primary trade-button--lg trade-button--block earn-submit" type="submit" disabled={busy || !validation.ok}>{pending ? "Processing…" : `${verb} ${asset}`}</button> :
          <button className="trade-button trade-button--primary trade-button--lg trade-button--block earn-submit wallet-connect-button" type="button" disabled={!wallet.isReady || wallet.isConnecting} onClick={() => void wallet.connect()}>{wallet.isConnecting ? "Connecting…" : "Connect wallet"}</button>}
        {!connected && <p className="earn-form-note">Connect to view balances and manage your position.</p>}
        <details className="earn-execution"><summary>Execution details<Icon name="chevron-down" size={20} /></summary>
          <dl aria-label="Transaction details">
            <div><dt>{verb} value</dt><dd>{formatEarnUsd(actionValue)}</dd></div>
            <div><dt>Fee</dt><dd>$0.00</dd></div>
            {connected && <div><dt>Resulting position</dt><dd data-testid="resulting-position">{formatEarnUsd(positionAfter)}</dd></div>}
            <div><dt>Asset price</dt><dd>{formatEarnUsd(earnAssetValue(BigInt(10) ** BigInt(EARN_ASSETS[asset].precision), asset))}</dd></div>
            {connected && <div><dt>Balance after</dt><dd>{formatEarnAmount(validation.ok ? balanceAfter : state.balances[asset], asset)} {asset}</dd></div>}
          </dl>
        </details>
      </div>
    </form>
    {connected && <section className="earn-ticket-position" aria-labelledby={`${id}-position`} aria-busy={loading}>
      <h3 id={`${id}-position`}>Your position</h3>
      <dl className="earn-position-metrics"><div><dt>Deposited value</dt><dd data-testid="pool-position">{formatEarnUsd(position)}</dd></div><div><dt>Fees earned</dt><dd data-testid="pool-earned-fees">{formatEarnUsd(feesEarned)}</dd></div></dl>
      <dl className="earn-supplied">{pool.assets.map((option) => <div key={option}><dt>{option} supplied</dt><dd>{formatEarnAmount(state.positions[pool.id]?.supplied[option] ?? ZERO, option)} {option}</dd></div>)}</dl>
    </section>}
  </aside>;
}
