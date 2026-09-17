"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { AssetPairSelector, type AssetPairId } from "./asset-pair-selector";
import {
  formatFinancial,
  formatFinancialWithAsset,
  formatSignedFinancial,
} from "./financial-format";
import {
  PERPETUAL_COLLATERAL,
  executablePrice,
  formatPerpetualInput,
  liquidationPrice,
  parsePerpetualAmount,
  perpetualLeverageLevels,
  perpetualMarginInput,
  perpetualMarkets,
  perpetualSizeInput,
  positionPerformance,
  type PerpetualMarket,
  type PerpetualPosition,
  type PerpetualSide,
  type PerpetualSizeUnit,
} from "./perpetuals-market";
import { TradingViewChart } from "./trading-view-chart";
import { useWallet } from "./wallet-provider";
import { usePortfolioRecords } from "./use-portfolio-records";
import { LUMIX_STELLAR_NETWORK } from "./stellar-network";
import {
  isTestnetTransactionConfirmed,
  PaymentPreflightError,
  PaymentValidationCancelledError,
  preparePerpetualsTestnetPayment,
  testnetTransactionUrl,
  type PaymentValidationDiagnostic,
  type TestnetPaymentPreview,
} from "./stellar-testnet-payment";

type SubmissionState =
  | "idle"
  | "preflighting"
  | "awaiting-approval"
  | "confirming"
  | "success"
  | "rejected"
  | "error"
  | "uncertain";

const SUCCESS_FEEDBACK_DURATION_MS = 5_000;
const ERROR_FEEDBACK_DURATION_MS = 8_000;

type OrderSubmission = {
  market: PerpetualMarket;
  side: PerpetualSide;
  margin: number;
  leverage: number;
  size: number;
  entryPrice: number;
  liquidationPrice: number;
  fee: number;
  transactionHash: string;
};

function performanceTone(value: number) {
  if (Math.abs(value) < 0.005) return "is-neutral";
  return value > 0 ? "is-positive" : "is-negative";
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForTestnetConfirmation(
  hash: string,
  attempts = 10,
  delayMs = 1_000,
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const confirmed = await isTestnetTransactionConfirmed(hash);

    if (confirmed) {
      return true;
    }

    if (attempt < attempts - 1) {
      await wait(delayMs);
    }
  }

  return false;
}

function OrderPanel({
  market,
  availableBalance,
  balanceStatus,
  isAuthenticated,
  isConnecting,
  isReady,
  historyReady,
  address,
  onConnect,
  onConfirmed,
  refreshBalances,
  sendTransaction,
}: {
  market: PerpetualMarket;
  availableBalance?: number;
  balanceStatus: "idle" | "loading" | "success" | "error";
  isAuthenticated: boolean;
  isConnecting: boolean;
  isReady: boolean;
  historyReady: boolean;
  address?: string;
  onConnect: () => void;
  onConfirmed: (submission: OrderSubmission) => void;
  refreshBalances: () => Promise<void>;
  sendTransaction: (xdr: string) => Promise<{ hash: string }>;
}) {
  const [side, setSide] = useState<PerpetualSide>("long");

  const [marginInput, setMarginInput] = useState("100");
  const [sizeUnit, setSizeUnit] = useState<PerpetualSizeUnit>("quote");
  const [sizeDraft, setSizeDraft] = useState<string | null>(null);

  const [leverage, setLeverage] = useState(Math.min(5, market.maximumLeverage));

  const [leverageDragging, setLeverageDragging] = useState(false);

  const leveragePointerStartRef = useRef<number | null>(null);

  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");

  const [submissionMessage, setSubmissionMessage] = useState("");

  const [paymentPreview, setPaymentPreview] =
    useState<TestnetPaymentPreview | null>(null);

  const [transactionHash, setTransactionHash] = useState("");

  const [validationProgress, setValidationProgress] = useState(0);

  const [canRetryValidation, setCanRetryValidation] = useState(false);

  const paymentPendingRef = useRef(false);

  const validationAbortRef = useRef<AbortController | null>(null);

  const validationRunRef = useRef(0);

  const recordedTransactionRef = useRef("");

  const mountedRef = useRef(true);

  const feedbackTimerRef = useRef<number | null>(null);

  const feedbackGenerationRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      validationRunRef.current += 1;
      validationAbortRef.current?.abort();
      feedbackGenerationRef.current += 1;

      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const marginUnits = parsePerpetualAmount(marginInput);
  const normalizedMargin = marginUnits !== undefined ? formatPerpetualInput(marginUnits) : "";
  const marginValue = Number(normalizedMargin);
  const margin = Number.isFinite(marginValue) && marginValue > 0 ? marginValue : undefined;

  const entryPrice = executablePrice(market, side);
  const hasPrice = Number.isFinite(entryPrice) && entryPrice > 0;
  const sizeInput = sizeDraft ?? perpetualSizeInput(marginInput, leverage, sizeUnit, entryPrice);
  const sizeError = sizeDraft && sizeDraft !== "." && parsePerpetualAmount(sizeDraft) === undefined
    ? "Size supports up to 7 decimal places." : undefined;
  const leverageLevels = perpetualLeverageLevels(market);

  const size = margin ? margin * leverage : undefined;

  const fee = size ? size * market.feeRate : undefined;

  const estimatedLiquidation = hasPrice
    ? liquidationPrice(market, side, entryPrice, leverage)
    : undefined;

  const marginError = (marginInput.split(".")[1]?.length ?? 0) > 7
    ? "Margin supports up to 7 decimal places."
    : !margin
    ? "Enter a margin amount."
    : margin < market.minimumMargin
      ? `Minimum margin is ${formatFinancialWithAsset(
          market.minimumMargin,
          PERPETUAL_COLLATERAL,
        )}.`
      : isAuthenticated &&
          balanceStatus === "success" &&
          availableBalance !== undefined &&
          margin > availableBalance
        ? "Insufficient available collateral."
        : undefined;

  const hasError = Boolean(
    !historyReady ||
    marginError ||
    sizeError ||
    !estimatedLiquidation ||
    !size ||
    !fee ||
    !entryPrice ||
    !address,
  );

  function clearFeedbackTimer() {
    if (feedbackTimerRef.current === null) {
      return;
    }

    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = null;
  }

  function showSubmissionFeedback(
    state: SubmissionState,
    message: string,
    dismissAfterMs?: number,
  ) {
    clearFeedbackTimer();

    const generation = feedbackGenerationRef.current + 1;
    feedbackGenerationRef.current = generation;
    setSubmissionState(state);
    setSubmissionMessage(message);

    if (!dismissAfterMs) {
      return;
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      if (
        !mountedRef.current ||
        feedbackGenerationRef.current !== generation
      ) {
        return;
      }

      feedbackTimerRef.current = null;
      setSubmissionMessage("");
      setCanRetryValidation(false);
      setSubmissionState("idle");
    }, dismissAfterMs);
  }

  function showTerminalFeedback(
    state: "success" | "rejected" | "error" | "uncertain",
    message: string,
  ) {
    setPaymentPreview(null);
    showSubmissionFeedback(
      state,
      message,
      state === "success"
        ? SUCCESS_FEEDBACK_DURATION_MS
        : ERROR_FEEDBACK_DURATION_MS,
    );
  }

  function dismissSubmissionFeedback() {
    feedbackGenerationRef.current += 1;
    clearFeedbackTimer();
    setSubmissionMessage("");
    setCanRetryValidation(false);

    if (
      submissionState !== "preflighting" &&
      submissionState !== "awaiting-approval" &&
      submissionState !== "confirming"
    ) {
      setSubmissionState("idle");
    }
  }

  function resetSubmission() {
    if (paymentPendingRef.current) {
      return;
    }

    validationRunRef.current += 1;

    validationAbortRef.current?.abort();
    validationAbortRef.current = null;
    feedbackGenerationRef.current += 1;
    clearFeedbackTimer();

    setPaymentPreview(null);
    setTransactionHash("");
    setValidationProgress(0);
    setCanRetryValidation(false);
    setSubmissionState("idle");
    setSubmissionMessage("");
  }

  function changeSide(nextSide: PerpetualSide) {
    setSide(nextSide);
    setSizeDraft(null);
    resetSubmission();
  }

  function changeMargin(value: string) {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setMarginInput(value);
    setSizeDraft(null);
    resetSubmission();
  }

  function changeSize(value: string) {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setSizeDraft(value);
    const nextMargin = perpetualMarginInput(value, leverage, sizeUnit, entryPrice);
    if (!value || value === ".") setMarginInput("");
    else if (nextMargin !== undefined) setMarginInput(nextMargin);
    resetSubmission();
  }

  function changeLeverage(value: number) {
    setLeverage(value);
    setSizeDraft(null);
    resetSubmission();
  }

  function finishLeverageInteraction() {
    leveragePointerStartRef.current = null;
    setLeverageDragging(false);
  }

  function recordConfirmedPosition(hash: string) {
    if (
      !mountedRef.current ||
      !margin ||
      !size ||
      !fee ||
      !estimatedLiquidation ||
      recordedTransactionRef.current === hash
    ) {
      return;
    }

    recordedTransactionRef.current = hash;

    onConfirmed({
      market,
      side,
      margin,
      leverage,
      size,
      entryPrice,
      liquidationPrice: estimatedLiquidation,
      fee,
      transactionHash: hash,
    });
  }

  async function confirmSubmittedPayment(hash: string) {
    showSubmissionFeedback(
      "confirming",
      "Payment submitted. Confirming it on Stellar testnet…",
    );

    try {
      const confirmed = await waitForTestnetConfirmation(hash);

      if (!mountedRef.current) {
        return;
      }

      if (!confirmed) {
        showTerminalFeedback(
          "uncertain",
          "Payment status is pending. Check the transaction before trying again.",
        );

        return;
      }

      recordConfirmedPosition(hash);

      try {
        await refreshBalances();
      } catch (error) {
        console.warn(
          "[Lumix] Transaction confirmed, but balance refresh failed:",
          error,
        );
      }

      if (!mountedRef.current) {
        return;
      }

      showTerminalFeedback("success", "Payment confirmed.");
    } catch (error) {
      console.error("[Lumix] Transaction confirmation failed:", error);

      if (!mountedRef.current) {
        return;
      }

      showTerminalFeedback(
        "uncertain",
        "Payment status could not be verified. Check the transaction before trying again.",
      );
    }
  }

  async function submitPreparedPayment(preview: TestnetPaymentPreview) {
    if (paymentPendingRef.current || !historyReady) {
      return;
    }

    paymentPendingRef.current = true;

    showSubmissionFeedback(
      "awaiting-approval",
      "Awaiting approval in your wallet…",
    );

    try {
      const submitted = await sendTransaction(preview.xdr);

      if (!mountedRef.current) {
        return;
      }

      if (!submitted?.hash) {
        throw new Error("Wallet did not return a transaction hash.");
      }

      if (submitted.hash.toLowerCase() !== preview.expectedHash.toLowerCase()) {
        console.error("[Lumix] Transaction hash mismatch", {
          expected: preview.expectedHash,
          returned: submitted.hash,
        });

        setTransactionHash(submitted.hash);

        showTerminalFeedback(
          "uncertain",
          "The wallet returned an unexpected transaction. Review it before trying again.",
        );

        return;
      }

      setTransactionHash(submitted.hash);

      await confirmSubmittedPayment(submitted.hash);
    } catch (error) {
      console.error("[Lumix] Transaction submission failed:", error);

      if (!mountedRef.current) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message.toLowerCase()
          : String(error).toLowerCase();

      const rejected = ["reject", "declin", "cancel", "dismiss", "denied"].some(
        (term) => message.includes(term),
      );

      if (rejected) {
        setTransactionHash("");
        showTerminalFeedback("rejected", "Payment cancelled.");

        return;
      }

      if (message.includes("not connected")) {
        setTransactionHash("");
        showTerminalFeedback(
          "error",
          "Wallet disconnected. Reconnect and try again.",
        );

        return;
      }

      /*
       * sendTransaction() may throw after the wallet
       * actually broadcast the transaction.
       *
       * The transaction hash is deterministic, so check
       * Horizon before telling the user it failed.
       */
      try {
        const confirmed = await waitForTestnetConfirmation(
          preview.expectedHash,
          5,
          1_000,
        );

        if (!mountedRef.current) {
          return;
        }

        if (confirmed) {
          setTransactionHash(preview.expectedHash);

          recordConfirmedPosition(preview.expectedHash);

          try {
            await refreshBalances();
          } catch (refreshError) {
            console.warn("[Lumix] Balance refresh failed:", refreshError);
          }

          if (!mountedRef.current) {
            return;
          }

          showTerminalFeedback("success", "Payment confirmed.");

          return;
        }
      } catch (confirmationError) {
        console.error(
          "[Lumix] Could not determine failed submission state:",
          confirmationError,
        );
      }

      if (!mountedRef.current) {
        return;
      }

      setTransactionHash(preview.expectedHash);

      showTerminalFeedback(
        "uncertain",
        "Payment status is unknown. Check the transaction before trying again.",
      );
    } finally {
      paymentPendingRef.current = false;
    }
  }

  async function reviewAndSubmitPayment() {
    if (!isAuthenticated) {
      onConnect();
      return;
    }

    if (
      hasError ||
      !margin ||
      !size ||
      !fee ||
      !entryPrice ||
      !estimatedLiquidation
    ) {
      showTerminalFeedback(
        "error",
        "Resolve the highlighted order requirements.",
      );

      return;
    }

    if (!address || paymentPendingRef.current) {
      return;
    }

    validationRunRef.current += 1;

    const runId = validationRunRef.current;

    validationAbortRef.current?.abort();

    const validationController = new AbortController();

    validationAbortRef.current = validationController;

    showSubmissionFeedback(
      "preflighting",
      "Checking payment requirements…",
    );

    setValidationProgress(0);
    setCanRetryValidation(false);
    setPaymentPreview(null);
    setTransactionHash("");

    const handleDiagnostic = (diagnostic: PaymentValidationDiagnostic) => {
      if (
        runId !== validationRunRef.current ||
        validationController.signal.aborted
      ) {
        return;
      }

      if (diagnostic.status === "success") {
        setValidationProgress((current) => Math.min(4, current + 1));
      }
    };

    try {
      const preview = await preparePerpetualsTestnetPayment(
        address,
        normalizedMargin,
        {
          signal: validationController.signal,
          timeoutMs: 8_000,
          onDiagnostic: handleDiagnostic,
        },
      );

      if (
        !mountedRef.current ||
        runId !== validationRunRef.current ||
        validationController.signal.aborted
      ) {
        return;
      }

      setPaymentPreview(preview);

      setTransactionHash(preview.expectedHash);

      setValidationProgress(4);
      setCanRetryValidation(false);

      await submitPreparedPayment(preview);
    } catch (error) {
      if (
        !mountedRef.current ||
        runId !== validationRunRef.current ||
        error instanceof PaymentValidationCancelledError ||
        validationController.signal.aborted
      ) {
        return;
      }

      console.error("[Lumix] Payment preflight failed:", error);

      setPaymentPreview(null);

      showTerminalFeedback(
        "error",
        error instanceof PaymentPreflightError
          ? error.message
          : "Payment failed. Please try again.",
      );

      setCanRetryValidation(true);
    } finally {
      if (runId === validationRunRef.current) {
        validationAbortRef.current = null;
      }
    }
  }

  function handlePrimaryAction() {
    if (!isAuthenticated) {
      onConnect();
      return;
    }

    void reviewAndSubmitPayment();
  }

  const validationBusy = submissionState === "preflighting";

  const paymentBusy =
    submissionState === "awaiting-approval" || submissionState === "confirming";

  const primaryLabel = !isAuthenticated
    ? isConnecting
      ? "Connecting…"
      : "Connect wallet"
    : submissionState === "preflighting"
      ? `Checking payment ${validationProgress}/4…`
      : submissionState === "awaiting-approval"
        ? "Awaiting wallet approval…"
        : submissionState === "confirming"
          ? "Confirming payment…"
          : side === "long"
            ? "LONG"
            : "SHORT";

  return (
    <section className="perp-order-panel" aria-labelledby="perp-order-heading">
      <div className="perp-order-panel-heading">
        <div>
          <h2 id="perp-order-heading">Order</h2>

          <span>{market.base} perpetual</span>
        </div>
      </div>

      <div className="perp-order-scroll">
        <div
          className="trade-segmented perp-direction-toggle"
          role="group"
          aria-label="Position side"
        >
          <button
            type="button"
            className={side === "long" ? "is-long" : ""}
            aria-pressed={side === "long"}
            disabled={validationBusy || paymentBusy}
            onClick={() => changeSide("long")}
          >
            Long
          </button>

          <button
            type="button"
            className={side === "short" ? "is-short" : ""}
            aria-pressed={side === "short"}
            disabled={validationBusy || paymentBusy}
            onClick={() => changeSide("short")}
          >
            Short
          </button>
        </div>

        <div className="trade-field perp-margin-field">
          <div className="trade-field-header">
            <label className="trade-label" htmlFor="perp-margin">
              Margin
            </label>
          </div>

          <div className={`trade-input-wrap${marginError ? " is-error" : ""}`}>
            <input
              id="perp-margin"
              className="trade-input trade-number"
              type="text"
              inputMode="decimal"
              value={marginInput}
              disabled={validationBusy || paymentBusy}
              onChange={(event) => changeMargin(event.target.value)}
            />

            <span className="trade-input-affix">{PERPETUAL_COLLATERAL}</span>
          </div>
        </div>

        {marginError && <p className="trade-field-error">{marginError}</p>}

        <div className="trade-field perp-size-field">
          <div className="trade-field-header"><label className="trade-label" htmlFor="perp-size">Size</label></div>
          <div className={`trade-input-wrap${sizeError ? " is-error" : ""}`}>
            <input id="perp-size" className="trade-input trade-number" type="text" inputMode="decimal" placeholder="0.00"
              value={sizeInput} disabled={validationBusy || paymentBusy || (sizeUnit === "base" && !hasPrice)}
              aria-invalid={Boolean(sizeError)} aria-describedby={sizeError ? "perp-size-error" : undefined}
              onChange={event => changeSize(event.target.value)}
              onBlur={() => { if (sizeDraft !== null && parsePerpetualAmount(sizeDraft) !== undefined) setSizeDraft(null); }} />
            <button
              type="button"
              className="trade-input-affix perp-size-unit"
              aria-label={`Size unit: ${sizeUnit === "quote" ? market.quote : market.base}. Switch to ${sizeUnit === "quote" ? market.base : market.quote}`}
              disabled={validationBusy || paymentBusy || (sizeUnit === "quote" && !hasPrice)}
              onClick={() => { setSizeUnit(unit => unit === "quote" ? "base" : "quote"); setSizeDraft(null); }}
            >
              {sizeUnit === "quote" ? market.quote : market.base}
            </button>
          </div>
        </div>
        {sizeError && <p className="trade-field-error" id="perp-size-error">{sizeError}</p>}
        {!hasPrice && <p className="trade-field-error">Market price unavailable. Try again shortly.</p>}

        <div className="perp-leverage-block">
          <div className="perp-section-heading">
            <span>Leverage</span>

            <strong className="trade-number">{leverage}x</strong>
          </div>

          <div
            className={`perp-leverage-control${
              leverageDragging ? " is-dragging" : ""
            }`}
            style={
              {
                "--perp-slider-progress": `${
                  ((leverage - market.minimumLeverage) /
                    (market.maximumLeverage - market.minimumLeverage)) *
                  100
                }%`,

                "--perp-slider-ratio":
                  (leverage - market.minimumLeverage) /
                  (market.maximumLeverage - market.minimumLeverage),
              } as CSSProperties
            }
          >
            <span className="perp-leverage-track" aria-hidden="true">
              <span className="perp-leverage-track-fill" />
              {leverageLevels.map(level => <span key={level} className={`perp-leverage-marker${level <= leverage ? " is-reached" : ""}`}
                style={{ left: `${(level - market.minimumLeverage) / (market.maximumLeverage - market.minimumLeverage) * 100}%` }} />)}
              <span className="perp-leverage-thumb" />
            </span>

            <input
              className="perp-leverage-slider"
              type="range"
              min={market.minimumLeverage}
              max={market.maximumLeverage}
              step={market.leverageStep}
              value={leverage}
              aria-label="Leverage"
              disabled={validationBusy || paymentBusy}
              onChange={(event) => changeLeverage(Number(event.target.value))}
              onPointerDown={(event) => {
                leveragePointerStartRef.current = event.clientX;
              }}
              onPointerMove={(event) => {
                if (
                  leveragePointerStartRef.current !== null &&
                  Math.abs(event.clientX - leveragePointerStartRef.current) > 2
                ) {
                  setLeverageDragging(true);
                }
              }}
              onPointerUp={finishLeverageInteraction}
              onPointerCancel={finishLeverageInteraction}
              onBlur={finishLeverageInteraction}
            />
          </div>

          <div className="perp-leverage-range" role="group" aria-label="Leverage levels">
            {leverageLevels.map(level => <button key={level} type="button" aria-label={`Set leverage to ${level}x`} aria-pressed={level === leverage}
              disabled={validationBusy || paymentBusy} onClick={() => changeLeverage(level)}
              style={{ "--perp-marker-ratio": (level - market.minimumLeverage) / (market.maximumLeverage - market.minimumLeverage) } as CSSProperties}>{level}x</button>)}
          </div>
        </div>

        <div className="perp-estimates">
          <div>
            <span>Estimated liquidation price</span>

            <strong className="trade-number">
              {estimatedLiquidation
                ? formatFinancialWithAsset(estimatedLiquidation, market.quote)
                : "—"}
            </strong>
          </div>

          <div>
            <span>Fees</span>

            <strong className="trade-number">
              {fee ? formatFinancialWithAsset(fee, market.quote) : "—"}
            </strong>
          </div>
          <div><span>Network fees</span><strong className="trade-number">{paymentPreview
            ? `${paymentPreview.feeXlm > 0 && paymentPreview.feeXlm < 0.01 ? "<0.01" : formatFinancial(paymentPreview.feeXlm)} XLM` : "—"}</strong></div>
        </div>

        {paymentPreview &&
          (submissionState === "awaiting-approval" ||
            submissionState === "confirming") && (
            <section
              className="perp-payment-review"
              aria-labelledby="perp-payment-review-title"
            >
              <div className="perp-payment-review-heading">
                <strong id="perp-payment-review-title">Testnet payment</strong>

                <span>{side === "long" ? "Long" : "Short"} margin</span>
              </div>

              <dl>
                <div>
                  <dt>Amount</dt>

                  <dd className="trade-number">
                    {paymentPreview.amount} {paymentPreview.assetCode}
                  </dd>
                </div>

                <div>
                  <dt>Destination</dt>

                  <dd
                    className="trade-number"
                    title={paymentPreview.destination}
                  >
                    {paymentPreview.destination}
                  </dd>
                </div>

                <div>
                  <dt>Network</dt>

                  <dd>{paymentPreview.networkLabel}</dd>
                </div>

              </dl>

              <p>
                This payment sends the margin amount on Stellar testnet.
              </p>
            </section>
          )}

        {submissionMessage && (
          <div
            className={`perp-order-feedback is-${submissionState}`}
            role={
              submissionState === "error" || submissionState === "rejected"
                ? "alert"
                : "status"
            }
            aria-live="polite"
          >
            <span aria-hidden="true" />

            <div>
              <span className="perp-order-feedback-message">
                {submissionMessage}
              </span>

              <div className="perp-order-feedback-actions">
                {transactionHash &&
                  (submissionState === "success" ||
                    submissionState === "uncertain") && (
                    <a
                      href={testnetTransactionUrl(transactionHash)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Stellar Expert
                    </a>
                  )}

                {canRetryValidation && submissionState === "error" && (
                  <button
                    type="button"
                    onClick={() => void reviewAndSubmitPayment()}
                  >
                    Retry validation
                  </button>
                )}

                <button type="button" onClick={dismissSubmissionFeedback}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="perp-order-action">
        <button
          className={`trade-button ${
            isAuthenticated
              ? side === "long"
                ? "trade-button--positive"
                : "trade-button--negative"
              : "trade-button--accent wallet-connect-button"
          }`}
          type="button"
          disabled={
            !isAuthenticated
              ? !isReady || isConnecting
              : paymentBusy || hasError
          }
          onClick={handlePrimaryAction}
        >
          {primaryLabel}
        </button>
      </div>
    </section>
  );
}

function MarketIdentity({ marketId }: { marketId: AssetPairId }) {
  const market = perpetualMarkets[marketId];

  return (
    <div className="perp-market-identity">
      <strong>
        {market.base} / {market.quote}
      </strong>

      <span>{market.name} perpetual</span>
    </div>
  );
}

function RecordsPanel({
  positions,
  onClose,
}: {
  positions: PerpetualPosition[];
  onClose: (id: string) => void;
}) {
  return (
    <section
      className="perp-records-panel"
      aria-labelledby="perp-records-heading"
    >
      <div className="perp-records-heading">
        <h2 id="perp-records-heading">Positions</h2>

        <span>
          {positions.length} open position
          {positions.length === 1 ? "" : "s"}
        </span>
      </div>

      {positions.length ? (
        <div className="trade-table-wrap perp-records-table-wrap">
          <table className="trade-table perp-records-table perp-positions-table">
            <caption className="trade-sr-only">
              Open perpetual positions
            </caption>

            <colgroup>
              <col className="perp-position-col-market" />
              <col className="perp-position-col-side" />
              <col className="perp-position-col-size" />
              <col className="perp-position-col-amount" />
              <col className="perp-position-col-entry" />
              <col className="perp-position-col-mark" />
              <col className="perp-position-col-liquidation" />
              <col className="perp-position-col-pnl" />
              <col className="perp-position-col-actions" />
            </colgroup>

            <thead>
              <tr>
                <th>Market</th>
                <th>Side</th>

                <th className="is-numeric">Size</th>

                <th className="is-numeric">Amount</th>

                <th className="is-numeric">Entry</th>

                <th className="is-numeric">Mark</th>

                <th className="is-numeric">Liquidation</th>

                <th className="is-numeric">Unrealized P&amp;L</th>

                <th className="is-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {positions.map((position) => {
                const market = perpetualMarkets[position.marketId];

                const performance = positionPerformance(position, market);

                const sideLabel = position.side === "long" ? "Long" : "Short";

                return (
                  <tr key={position.id}>
                    <td data-label="Market">
                      <MarketIdentity marketId={position.marketId} />

                      {position.transactionHash && (
                        <a
                          className="perp-position-transaction"
                          href={testnetTransactionUrl(position.transactionHash)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Testnet transaction
                        </a>
                      )}
                    </td>

                    <td data-label="Side">
                      <span
                        className={`trade-badge trade-badge--${position.side}`}
                      >
                        {sideLabel}
                      </span>
                    </td>

                    <td className="is-numeric" data-label="Size">
                      {formatFinancialWithAsset(position.size, market.quote)}
                    </td>

                    <td className="is-numeric" data-label="Amount">
                      {formatFinancialWithAsset(
                        position.margin,
                        PERPETUAL_COLLATERAL,
                      )}
                    </td>

                    <td className="is-numeric" data-label="Entry">
                      {formatFinancial(position.entryPrice)}
                    </td>

                    <td className="is-numeric" data-label="Mark">
                      {formatFinancial(position.markPrice)}
                    </td>

                    <td className="is-numeric" data-label="Liquidation">
                      {formatFinancial(position.liquidationPrice)}
                    </td>

                    <td
                      className={`is-numeric perp-performance ${performanceTone(
                        performance.pnl,
                      )}`}
                      data-label="Unrealized P&L"
                    >
                      {formatSignedFinancial(performance.pnl)} {market.quote}
                    </td>

                    <td className="perp-record-actions" data-label="Actions">
                      <div className="perp-record-actions-inner">
                        <button
                          type="button"
                          disabled={position.status === "closing"}
                          onClick={() => onClose(position.id)}
                        >
                          {position.status === "closing"
                            ? "Closing…"
                            : "Close position"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="perp-empty-state">No open positions</div>
      )}
    </section>
  );
}

export function PerpetualsWorkspace() {
  const {
    address,
    balanceStatus,
    connect,
    getBalance,
    isAuthenticated,
    isConnecting,
    isReady,
    refreshBalances,
    sendTransaction,
  } = useWallet();

  const [marketId, setMarketId] = useState<AssetPairId>("BTC-USDC");

  const history = usePortfolioRecords(isAuthenticated ? address : undefined);
  const positions = (history.data?.payments ?? []).filter((record) => !record.hidden).map((record) => record.position);

  const serviceTimers = useRef<number[]>([]);

  const market = perpetualMarkets[marketId];

  const networkBalance = getBalance(
    PERPETUAL_COLLATERAL,
    LUMIX_STELLAR_NETWORK.assets.USDC.issuer,
  );

  const availableBalance = networkBalance;

  useEffect(
    () => () => {
      serviceTimers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  useEffect(() => {
    serviceTimers.current.forEach((timer) => window.clearTimeout(timer));

    serviceTimers.current = [];

  }, [address, isAuthenticated]);

  function confirmOrder(submission: OrderSubmission) {
    history.recordPayment({
      id: submission.transactionHash,
      at: Date.now(),
      position: {
        id: submission.transactionHash,
        marketId: submission.market.id,
        side: submission.side,
        size: submission.size,
        margin: submission.margin,
        leverage: submission.leverage,
        entryPrice: submission.entryPrice,
        markPrice: submission.market.currentPrice,
        liquidationPrice: submission.liquidationPrice,
        transactionHash: submission.transactionHash,
        isTestnetDemo: true,
        status: "open",
      },
    });
  }

  function closePosition(id: string) {
    const position = positions.find((item) => item.id === id);

    if (!position || position.status === "closing") {
      return;
    }

    const timer = window.setTimeout(() => {
      // Removing a displayed payment is not a trade settlement or realized P&L.
      history.update((current) => ({ ...current, payments: current.payments.map((record) => record.id === id ? { ...record, hidden: true } : record) }));
    }, 900);

    serviceTimers.current.push(timer);
  }

  return (
    <>
      {history.status === "error" && <p role="alert">Payment history could not be loaded or saved. <button type="button" onClick={history.reload}>Retry</button></p>}
      <header className="options-page-header">
        <div className="options-title-block">
          <h1 id="perpetuals-title">Perpetuals</h1>

          <p>Trade perpetuals with flexible leverage.</p>
        </div>

        <dl className="options-market-summary">
          <div className="options-market-pair">
            <dt>Market</dt>

            <dd>
              <AssetPairSelector
                label="Perpetual market"
                value={marketId}
                onChange={setMarketId}
              />
            </dd>
          </div>

          <div>
            <dt>Current price</dt>

            <dd className="trade-number options-current-price-value">
              {market.base} - ${formatFinancial(market.currentPrice)}
            </dd>
          </div>
        </dl>
      </header>

      <div className="perp-page-sections">
        <div className="perp-workspace-grid">
          <TradingViewChart key={market.id} asset={market.base} />

          <OrderPanel
            key={`${marketId}:${address ?? "disconnected"}`}
            market={market}
            availableBalance={availableBalance}
            balanceStatus={balanceStatus}
            isAuthenticated={isAuthenticated}
            isConnecting={isConnecting}
            isReady={isReady}
            historyReady={history.status === "ready"}
            address={address}
            onConnect={() => void connect()}
            onConfirmed={confirmOrder}
            refreshBalances={refreshBalances}
            sendTransaction={sendTransaction}
          />
        </div>

        {isAuthenticated ? (
          <RecordsPanel positions={positions} onClose={closePosition} />
        ) : (
          <section
            className="perp-records-panel wallet-private-gate"
            aria-labelledby="perp-records-heading"
          >
            <div className="perp-records-heading">
              <h2 id="perp-records-heading">Positions</h2>
            </div>

            <div className="wallet-private-gate-content">
              <strong>Connect your wallet to view positions</strong>

              <span>
                Private trading activity stays hidden until authentication
                succeeds.
              </span>

              <button
                className="trade-button trade-button--primary wallet-connect-button"
                type="button"
                disabled={!isReady || isConnecting}
                onClick={() => void connect()}
              >
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
