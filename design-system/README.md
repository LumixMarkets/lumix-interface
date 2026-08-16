# Stellar Trading Design System

Version 0.2.0 — dark-default adaptive trading system, working brand layer pending.

This package is the visual and interaction foundation for a non-custodial, Stellar- and Soroban-native platform spanning:

- spot swaps routed across external liquidity;
- standardized options;
- custom option RFQs;
- vault-backed perpetual futures;
- pair-specific liquidity vaults with dynamic Blend deployment;
- unified portfolio and activity.

It is a design-system deliverable, not the website. Open `index.html` for the interactive component explorer.

## Direction of this revision

Version 0.2.0 deliberately moves closer to the supplied older design system:

- dark-default theme with a complete light semantic remap;
- the exact legacy Poly Blue, Pure Gray, green, and red palette;
- the original Inter type scale: 64, 48, 36, 28, 22, 18, 16, 14, and 12px;
- 8px spacing rhythm with the original 4px half-step;
- 16px cards, 12px controls, and pill tags;
- blue filled primary buttons;
- raised dark inputs and selected navigation items;
- 20–24px card padding and 12–16px grid gaps;
- dense 13px table rows with 11px uppercase headers;
- chart styling with dashed 4–4 grids, two-pixel series, restrained fills, and muted axes;
- the older documentation shell: a 220px dark sidebar and a focused 1100px specimen canvas.

Two compatibility adjustments are intentional: critical small copy does not use the legacy `#6E6E73` muted gray on dark surfaces because it falls below WCAG AA, and the supplied light palette is mapped to the same semantic roles without changing component anatomy. The source color is retained as a primitive/reference value; readable small copy uses a slightly lifted semantic alias.

See [MIGRATION.md](MIGRATION.md) for the full source comparison and revision map.
See [SOURCE_AUDIT.md](SOURCE_AUDIT.md) for the inspected archive inventory and evidence used.

## Product—not source—semantics

The visual source and the product model are separate. This system contains no binary-event trading model, market resolution model, or leaderboard concept.

The product vocabulary is:

- spot: pay, receive, best route, alternative route, price impact, slippage, fees, minimum received, route composition;
- options: call, put, strike, expiration, premium, break-even, collateral, intrinsic value, estimated time value, exercise, settlement;
- RFQ: request, quote, writer, premium, quote expiry, collateral, settlement, accepted/declined/expired;
- perpetuals: long, short, collateral, leverage, entry, liquidation, borrowing, funding, open interest, capacity;
- vaults: reserved, safety, free, Blend-deployed, pending withdrawals, fee APR, lending APR, incentive APR, trader-PnL effect;
- portfolio: wallet balance, exposure, positions, orders, RFQs, vault shares, claimable amounts, realized and unrealized PnL.

## Design principles

### Capital remains legible

Never collapse wallet-available balance, perpetual margin, option collateral, reserved vault capital, safety capital, free capital, Blend-deployed capital, and pending withdrawals into one number.

### Risk precedes commitment

Show fees, price impact, slippage, liquidation price, collateral obligation, settlement configuration, capacity limits, and withdrawal constraints before requesting a wallet signature.

### Capacity is a product state

When long or short capacity is unavailable, preserve the user’s inputs, show the limiting amount, explain the vault or risk constraint, and offer the nearest valid action.

### Yield is decomposed

Display fee APR, Blend lending APR, applicable incentives, realized trader-PnL effect, unrealized trader-PnL effect, asset-price performance, and total historical return separately. Never imply guaranteed yield.

### Direction is never color-only

Long/short, call/put, buy/sell, profit/loss, and success/failure include labels, signs, position, or status in addition to color.

### Signatures explain intent

Before a wallet opens, name the action, assets, maximum amount, fees, trustline or authorization requirements, and expected next state.

### Advanced detail is one layer away

Default surfaces show decision-critical numbers. Route composition, Greeks, funding breakdowns, oracle metadata, collateral math, and vault strategy detail remain available without overwhelming the initial view.

## Foundations

### Color

The interface is approximately 95% neutral.

| Token | Value | Role |
| --- | --- | --- |
| Accent | `#2E5CFF` | Primary transaction, focus, active nav, selected state, neutral series |
| Accent hover | `#1E48E6` | Filled accent hover |
| Accent tint | `#0F1730` | Selected or highlighted blue surface |
| Accent text | `#8FA6FF` | Text and data on dark surfaces |
| Canvas | `#0A0A0B` | Page background |
| Surface | `#141416` | Card and panel |
| Raised | `#1C1C1F` | Inputs, selected nav, nested metrics |
| Border | `#2A2A2D` | Hairline separation |
| Text primary | `#F4F4F5` | Primary content |
| Text secondary | `#A1A1A6` | Supporting content |
| Interface muted | `#85858B` | Small metadata and helper copy that must remain AA-readable |
| Legacy muted | `#6E6E73` | Primitive/reference only; disabled or non-text decoration |
| Positive | `#35C46A` | Long, call, profit, completion |
| Positive tint | `#10241A` | Positive selected surface |
| Negative | `#F0524B` | Short, put, loss, destructive/error |
| Negative tint | `#241214` | Negative selected surface |
| Warning | `#FFBA00` | Stale oracle, expiry, liquidation proximity, capacity |

Green and red reinforce financial meaning; they are not decorative accent colors. Capital allocation uses labels and exact values because the restrained palette intentionally limits categorical color variety.

Light mode keeps the same hierarchy and component contracts. It remaps canvas to `#F6F6F8`, surfaces to white and soft gray, primary text to `#17171A`, action blue to `#244DE0`, and semantic statuses to their darker AA-readable light-theme values. Set `data-theme="light"` on the document root; omit it or use `data-theme="dark"` for the default theme.

### Typography

- Inter for interface copy.
- System monospace for addresses, exact financial values, countdowns, hashes, and tabular comparison columns.
- Original display scale retained for system documentation and future marketing surfaces.
- Component body copy generally uses 13–14px; ordinary prose uses 16px.
- Table headers use 11px uppercase labels with `0.06em` tracking.
- Comparable numeric columns are right-aligned and use tabular numerals.

### Spacing and radius

- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px.
- Cards: 16px radius.
- Inputs and buttons: 12px radius.
- Nested controls: 8–10px radius.
- Tags: pill radius.
- Standard card padding: 20px; documentation cards: 24px.
- Compact rows: 12px vertical rhythm; touch layouts retain 44px targets.

### Elevation

Cards separate through surface contrast and one-pixel borders. Shadows are limited to the command palette/modal, chart tooltip, and selected segmented control—the same restrained exceptions used by the older system.

### Motion

- Hover/control: 150ms.
- Dropdown: 200ms.
- Modal: 250ms.
- Page/section: 200ms.
- Data transitions: 400ms.
- No bounce, elastic easing, card lift, or press-scale effect.
- `prefers-reduced-motion` is included.

## Component inventory

### Core

- `Button`: primary, secondary, ghost, danger, success, positive, negative; small, medium, large; loading and disabled.
- `Badge`: neutral, live, success, pending, warning, error, stale, limited, long, short, call, put.
- `Panel`: base, compact, raised, inset, interactive, risk.
- `Field`: label, metadata, helper/error, prefix/suffix, read-only, warning, unavailable.
- `AmountField`: amount, asset, balance, fiat context, MAX affordance, trustline state.
- `Tabs`, `SegmentedControl`, `Breadcrumbs`, `CommandSearch`.
- `Alert`, `Modal`, `Timeline`, `Skeleton`, `EmptyState`.
- `DataTable`: sorting/filtering hooks, numeric alignment, hover, selected, empty, loading, responsive row layout.

### Financial primitives

- `Price` and `PnL`.
- `Metric` with source/freshness context.
- `DirectionSelector` for long/short and call/put.
- `QuoteBreakdown` for route, fees, price impact, slippage, minimum received, and expiry.
- `RiskSummary` for collateral, max loss/obligation, liquidation, and warnings.
- `CapacityMeter`.
- `CapitalStack` with reserved, safety, free, Blend-deployed, and pending buckets.
- `StatusTimeline`.
- `OracleStatus`.

### Product compounds

- `SpotSwapTicket` and `RouteComparison`.
- `OptionContractCard`, `OptionsChain`, `OptionBuyTicket`, `OptionWriteTicket`, `ExercisePreview`.
- `RFQComposer`, `RFQQuoteTable`, `RFQStatusTimeline`.
- `PerpOrderTicket`, `CapacityPanel`, `PositionCard`, `PositionTable`.
- `VaultSummary`, `VaultCapitalBreakdown`, `ReturnDecomposition`, `DepositWithdrawTicket`.
- `UnifiedPortfolioTable` and `ActivityFeed`.
- `TransactionPreview` and `WalletSignatureRequest`.

## Status vocabulary

| Area | Labels |
| --- | --- |
| Orders | Draft, Ready, Awaiting signature, Submitted, Open, Partially filled, Filled, Cancelled, Rejected, Expired |
| Options | Active, Exercisable, Exercised, Expiring, Expired, Settling, Settled |
| RFQs | Draft, Open for quotes, Quote received, Quote expiring, Accepted, Declined, Expired, Created |
| Perpetuals | Open, Reducing, Closing, Liquidation risk, Liquidated, Closed |
| Vaults | Available, Limited, Deposit pending, Withdrawal available, Withdrawal queued, Withdrawing, Completed |
| Data | Live, Delayed, Stale, Unavailable |

## Accessibility baseline

- WCAG 2.2 AA for actionable and decision-critical text.
- Native controls or semantic equivalents for form controls.
- Visible focus treatment on every interactive element.
- 44px touch targets on compact layouts.
- Direction and PnL communicated with labels/signs as well as color.
- Stale, loading, and unavailable values never presented as `0.00`.
- Missing financial values use an em dash or an explicit `Unavailable` label.
- Reduced-motion support.

## Use

Import the single CSS entry:

```css
@import url('./_ds/stellar-trading-design-system-v0.2.0/styles.css');
```

Open `index.html` directly to inspect the interactive, stack-neutral specimen. It does not require a build step.

Run validation from the package directory:

```bash
node scripts/validate.mjs
```

## Package structure

```text
stellar-trading-design-system-v0.2.0/
├── README.md
├── MIGRATION.md
├── SOURCE_AUDIT.md
├── _ds_manifest.json
├── index.html
├── preview.js
├── styles.css
├── components/
│   └── components.css
├── patterns/
│   ├── product-patterns.md
│   ├── responsive.md
│   └── states.md
├── scripts/
│   └── validate.mjs
└── tokens/
    ├── base.css
    ├── motion.css
    ├── primitives.css
    ├── spacing.css
    ├── themes.css
    ├── tokens.json
    └── typography.css
```

## Decisions still open

The system does not decide:

- final name, logo, or brand personality;
- frontend framework or component API;
- charting library;
- exact perpetual markets, leverage, fees, oracle, or settlement methodology;
- launch option strikes and expirations;
- covered-call settlement asset;
- vault deposit ratios, maximum Blend allocation, withdrawal queues, or insurance size;
- whether option-writing vaults or yield wrappers ship in the MVP.

Specimen values are realistic examples marked as illustrative or configurable. They are not protocol parameters.
