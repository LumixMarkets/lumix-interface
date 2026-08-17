# Product pattern contracts

These contracts define what each compound must communicate. They are not final screen layouts and do not prescribe unresolved financial parameters.

## Scope guardrails

- Standardized options do not assume a launch secondary market. Initial position actions are buy, write, exercise, settle, and inspect history.
- American cashless exercise is the working standardized model; the settlement asset remains contract configuration.
- Physical settlement is not presented as a standardized-market promise. It may appear only when an RFQ explicitly supports it.
- Covered calls lock the full underlying amount and cash-secured puts lock strike × quantity. Uncovered calls and partially collateralized puts are not offered in the initial system.
- A perpetual LP vault does not automatically write options. Any future option-writing vault is a distinct product and contract family.
- Transferable yXLM/yUSDC wrappers are later standalone products, not required for the perpetual vault’s direct Blend integration.
- Insurance is a separate reserve and risk explanation, never a guarantee against all loss.

## Shared anatomy

Every transactional compound follows the same sequence:

1. Intent: product, market, direction, and action.
2. Inputs: assets, size, collateral, leverage, strike, expiry, or settlement configuration.
3. Live preview: executable quote or current estimate with freshness.
4. Capacity and eligibility: balance, trustline, collateral, market/vault capacity, oracle, and permissions.
5. Cost and risk: fees, slippage/impact, liquidation, obligation, or withdrawal restriction.
6. Commit: precise action label.
7. Signature: explicit wallet request with asset and contract details.
8. Progress: submitted, confirming, completed, or failed state.

Never jump directly from user input to a generic wallet prompt.

## App shell

Primary desktop navigation:

- Dashboard
- Spot
- Options
- Perpetuals
- Earn / Vaults
- Portfolio
- Activity

Wallet and settings live at the utility end of the header, not as a peer product.

On compact layouts, use a small bottom navigation for the highest-frequency destinations and an overflow menu for the remainder. Do not attempt to reproduce the full desktop terminal at phone width.

## Dashboard

Use the design system to compose:

- Portfolio value and wallet summary.
- Open options and time-sensitive expirations.
- Perpetual positions and liquidation proximity.
- Pending orders and RFQs.
- Vault shares and withdrawal states.
- Recent transactions and settlement events.
- Product availability or degraded-service notices.

The dashboard is a status and action surface, not a promotional market feed.

## Spot

### `SpotSwapTicket`

Required default anatomy:

- Pay asset + amount.
- Available balance and MAX.
- Receive asset + estimated amount.
- Best route label.
- Quote freshness and refresh state.
- Price impact.
- Slippage setting.
- Protocol/venue fees.
- Platform/integrator fee when applicable.
- Minimum received.
- Trustline or authorization requirement.
- Primary action: `Review swap`, followed by `Swap {asset} for {asset}`.

Expanded route details:

- Venue sequence.
- Split percentages.
- Per-hop amounts.
- Venue and network fees.
- Quote expiry.

Route comparison uses a compact table. Mark the best route with a neutral `Best execution` badge; do not use success green, which implies transaction completion.

### Spot unavailable state

Keep both asset inputs and the user's amount visible. Replace the quote with the reason: no route, insufficient liquidity, stale quote, unsupported trustline, or asset authorization. Offer a relevant next action.

## Standardized options

### Market header

Show:

- Underlying and quote asset.
- Spot/index price and update age.
- Expiration selector.
- Call/put selector or split chain labels.
- Exercise style.
- Settlement method as a configurable field; never hard-code the unresolved covered-call settlement asset.
- Time to expiration.
- Oracle/settlement status.

### `OptionsChain`

Desktop default:

- Calls on the left, strike center column, puts on the right.
- Sticky strike column where practical.
- Bid/ask or available premium.
- Implied volatility when available; use an em dash with tooltip when unavailable.
- Volume/open interest if the protocol exposes them.
- In-the-money treatment uses a quiet surface tint plus an `ITM` label; never color alone.
- Selected contract uses accent border/row selection, not a full semantic fill.
- Calls use positive color only in headers or compact directional cues; puts use negative color in the corresponding way.

Mobile default:

- Call/put segmented selector.
- One-sided contract list.
- Sticky expiration/underlying context.
- Contract rows open a bottom sheet or dedicated action surface.

### `OptionBuyTicket`

Required:

- Contract summary: underlying, call/put, strike, expiry, contract size.
- Quantity.
- Premium per contract and total premium.
- Break-even.
- Maximum loss (`premium paid`) and potential payoff explanation.
- Fees.
- Settlement method placeholder/configuration.
- Available balance and trustline status.
- Quote expiry/freshness.

### `OptionWriteTicket`

Required:

- Contract summary.
- Quantity.
- Premium received.
- Collateral asset and exact required amount.
- Covered-call or cash-secured-put label.
- Maximum obligation / loss explanation.
- Funds that will become locked.
- Balance after lock.
- Fees.
- Settlement method placeholder/configuration.

Do not present premium received as yield without the collateral obligation and risk context alongside it.

### `ExercisePreview`

Required:

- Current exercise eligibility.
- Current spot/settlement price and update age.
- Strike and quantity.
- Estimated intrinsic value.
- Estimated remaining time value when available.
- Estimated payout and payout asset as configuration.
- Fees/conversion impact when applicable.
- Explicit early-exercise warning.
- Acknowledgement when estimated time value is positive.

Primary actions:

- `Review cashless exercise`.
- `Exercise option` only on final confirmation.

Automatic settlement uses a status timeline rather than an action button.

## Option RFQs

### `RFQComposer`

Fields:

- Underlying.
- Call or put.
- Size.
- Strike.
- Expiration.
- Exercise style.
- Settlement method.
- Quote response deadline.
- Optional requester note where product rules permit it.

Review state shows collateral and settlement implications before submission.

### `RFQQuoteTable`

Columns:

- Premium.
- Total cost.
- Quote expiry countdown.
- Settlement method.
- Writer/market-maker identity.
- Reputation or completion data when supported.
- Collateral confirmed state.
- Action.

Sort primarily by executable total cost, not advertised premium alone. Expired quotes remain visible but non-actionable so users understand why they disappeared.

### RFQ status timeline

Recommended sequence:

1. RFQ submitted.
2. Open for quotes.
3. Quote received.
4. Quote selected.
5. Awaiting signature.
6. Premium paid and collateral locked.
7. Option created.

Atomic creation should be explained in the confirmation copy without exposing unnecessary contract jargon.

## Perpetual futures

### Market workspace

Persistent context:

- Market selector.
- Oracle/index price and update age.
- Price chart.
- Long and short capacity.
- Open interest and imbalance.
- Borrowing rate.
- Funding rate.
- Vault utilization.

### `PerpOrderTicket`

Required:

- Long/short selector.
- Order type: market, limit, stop, take profit.
- Collateral amount and asset.
- Leverage input with keyboard-accessible numeric alternative.
- Position size.
- Entry price estimate.
- Liquidation price.
- Opening fee.
- Estimated borrowing/funding cost with timeframe.
- Price impact/skew adjustment.
- Available capacity and maximum position.
- Optional take-profit and stop-loss.
- Isolated margin label.

When leverage changes, update liquidation proximity visually and textually. Never use a slider without an exact numeric value and direct-entry alternative.

### Capacity-limited state

Show:

- Requested position.
- Maximum available position.
- Long or short capacity remaining.
- Limiting factor.
- Suggested valid amount.

Preserve the user's order configuration. Do not clear inputs or show only `Transaction failed`.

### Position management

Use the same risk hierarchy for open and close/reduce flows:

- Current size and collateral.
- Entry, index, and liquidation prices.
- Realized and unrealized PnL separated.
- Accrued borrowing and funding.
- Close/reduce amount.
- Estimated exit price and fees.
- Remaining position after action.

## Earn / Vaults

### `VaultSummary`

Required:

- Pair/vault name.
- Underlying assets.
- TVL.
- Share price.
- Historical total return, explicitly historical.
- Fee APR.
- Blend lending APR.
- BLND incentive APR when applicable.
- Trader-PnL effect, realized and unrealized separated where possible.
- Utilization and long/short capacity.
- Withdrawal availability.
- Risk label and link.

Do not collapse these into a single promotional APY without accessible decomposition.

### `VaultCapitalBreakdown`

Use a labeled capital stack with:

- Reserved capital.
- Safety capital.
- Free liquid capital.
- Blend-deployed capital.
- Pending withdrawals.

Every segment has exact value, percentage, and tooltip definition. Blend-deployed assets are not labeled liquid or immediately available.

### Deposit/withdraw ticket

Deposit preview:

- Deposit asset(s) and ratio requirement as configuration.
- Estimated shares.
- Share price.
- Fees.
- Trustline/authorization.
- Risk acknowledgement.

Withdrawal preview:

- Shares burned.
- Estimated assets returned.
- Immediately available amount.
- Queued amount.
- Cooldown/queue rule as configuration.
- Blend recall dependency where applicable.
- Fees.

## Portfolio

The portfolio summary separates:

- Wallet balance.
- Available trading balance.
- Option market value.
- Locked option collateral.
- Perpetual collateral.
- Unrealized PnL.
- Vault share value.
- Claimable earnings.
- Pending withdrawals.

Use product tabs or filters without fragmenting the total-exposure summary.

Tables should support a unified activity vocabulary but retain product-specific columns. A generic "Positions" table that hides whether exposure is an option, perp, or vault is insufficient.

## Activity

Activity items include:

- Product and action.
- Asset/market.
- Amount.
- Status.
- Time.
- Transaction or contract reference.
- Failure reason and recovery action where relevant.

Group multi-transaction workflows—trustline, approval, deposit, option creation—into one understandable activity thread while retaining access to individual transactions.
