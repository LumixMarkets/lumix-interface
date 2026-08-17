# State and transaction patterns

Financial interfaces are defined as much by unavailable and in-progress states as by their ideal state. Do not add these after the happy path.

## Global state hierarchy

| State | Visual treatment | Interaction rule |
| --- | --- | --- |
| Loading | Skeletons matching the final layout | Preserve surrounding context; do not show zero values |
| Refreshing | Existing data remains visible with freshness indicator | Avoid layout shift; prevent action only if data is unsafe |
| Empty | Clear explanation and relevant next action | Do not imply an error |
| Limited | Amber badge/banner plus exact available amount | Keep valid actions enabled |
| Stale | Amber state with last update time | Block price-sensitive commits when required by product rules |
| Unavailable | Neutral or error state with reason | Preserve user input and offer recovery |
| Failed | Error summary, precise reason, retry/review path | Never reduce to a red toast alone |
| Completed | Persistent success state and resulting position/balance | Do not rely only on a transient toast |

## Data freshness

Every price-sensitive value may expose:

- Source label.
- Last update timestamp or age.
- Delayed/stale threshold state.
- Confidence or spread when available.
- Action impact: informational, quote refresh, or trade blocked.

Recommended labels:

- `Live` — inside accepted freshness threshold.
- `Delayed` — usable for display, not guaranteed executable.
- `Stale` — unsafe for new price-sensitive commitment.
- `Unavailable` — no defensible value.

Never replace stale or unavailable financial data with `0`.

## Wallet and Stellar prerequisites

### Disconnected

- Explain what connecting enables.
- Keep browsing and non-transactional data available.
- Primary action: `Connect wallet`.

### Wrong or unsupported network

- Name current and required network.
- Primary action should be precise if switching is supported.
- Never request a transaction before the network is corrected.

### Trustline required

- Name the asset and issuer.
- Explain that the trustline enables the wallet to hold the asset.
- Show reserve/network implications when available.
- Treat trustline creation as its own visible transaction step.

### Asset authorization required or denied

- Distinguish missing authorization from a technical error.
- Explain whether the user can self-resolve it.
- Disable only actions that require the asset.

### Insufficient native reserve

- Separate spendable XLM from minimum reserve.
- Show the missing amount and why it is reserved.
- Do not display wallet balance as fully spendable.

## Transaction lifecycle

Use the status timeline for multi-step actions.

1. `Review` — local preview, no wallet request.
2. `Prerequisite required` — trustline, authorization, or approval.
3. `Awaiting signature` — wallet prompt is open.
4. `Submitted` — transaction hash exists.
5. `Confirming` — waiting for ledger inclusion/finality.
6. `Confirmed` — on-chain action completed.
7. `Indexing` or `Settling` — product state is catching up, when applicable.
8. `Complete` — resulting balance, position, RFQ, or vault state is visible.

Failure can occur at any step. Preserve completed prerequisite steps and identify the failed step.

### Signature prompt copy

The prompt should answer:

- What action is being signed?
- Which contract or route is involved?
- Which assets can move, and what is the maximum amount?
- Which fees are expected?
- Is collateral being locked?
- What will appear after confirmation?

## Quotes and orders

### Quote freshness

Quotes use a visible countdown or timestamp. On expiry:

- Keep the prior quote visible but marked `Expired`.
- Disable commit.
- Offer `Refresh quote`.
- Preserve inputs.

### Partial fill

Show:

- Original size.
- Filled size.
- Remaining size.
- Average execution price.
- Fees paid so far.
- Cancel action where available.

### Rejected or reverted

Differentiate:

- User rejected signature.
- Quote expired.
- Slippage exceeded.
- Capacity changed.
- Insufficient balance.
- Contract rejection.
- Network failure.
- Trustline or authorization issue.

Each reason gets a relevant recovery action.

## Options

### Early exercise

When time value is estimated above zero:

- Use a warning panel, not only a tooltip.
- Show estimated intrinsic value and estimated time value separately.
- State that early exercise realizes intrinsic value and may forfeit remaining time value.
- Require a clear acknowledgement before final commit.

### Expiration

States:

- `Active`.
- `Expiring soon`.
- `Exercise window` when applicable.
- `Awaiting settlement`.
- `Settling`.
- `Settled`.
- `Settlement delayed`.

Automatic settlement displays expected payout and settlement asset as configuration, not a hard-coded assumption.

### Seller collateral

Show locked, releasable, and released collateral as distinct states. Do not show collateral as wallet-available until the release transaction is confirmed.

## RFQs

### No quotes

State whether the RFQ is still open, when it expires, and whether details can be edited or cancelled. Do not show a generic empty table.

### Quote about to expire

Use warning treatment when the remaining acceptance window is short. Final thresholds are product configuration.

### Quote accepted by another state change

If the quote is no longer executable, keep it visible as `Unavailable` and explain whether it expired, was withdrawn, or failed collateral validation.

## Perpetuals

### Capacity reached

Show available long and short capacity independently. When one side is capped, the other side may remain enabled.

### Liquidation proximity

Use progressive warning levels driven by configurable risk thresholds:

- Neutral: liquidation value visible.
- Warning: distance narrows; show amber risk panel.
- Critical: show red risk panel and prioritize add-collateral/reduce actions.

Never imply that warnings guarantee time to act.

### Oracle stale

If new positions are blocked:

- Existing positions remain visible.
- Mark PnL estimates as stale.
- Explain whether close/reduce actions are available.
- Do not present stale liquidation distance as current.

## Vaults

### Withdrawal availability

Distinguish:

- Immediately available.
- Available after recall from Blend.
- Queued.
- Cooldown active.
- Temporarily paused.

### Historical performance

- Label timeframe.
- Separate realized and unrealized trader-PnL effect.
- Keep asset-price performance separate from strategy performance.
- Never convert short histories into annualized certainty without clear methodology.

### Insurance

An insurance reserve is a separate metric and risk explanation. Do not display it as a shield icon implying all losses are covered.

## Toast policy

Toasts are secondary confirmation only.

- Success toast: concise action + amount/asset.
- Error toast: short reason + link to persistent detail.
- Pending toast: avoid indefinite animation; link to activity.
- Never place the only transaction hash, failure reason, or recovery action in a toast.
