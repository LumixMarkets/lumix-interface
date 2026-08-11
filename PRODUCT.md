# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, React, strict TypeScript, and Tailwind CSS. The existing `design-system/` package is imported globally and remains the visual source of truth; no additional UI library is used.

## Users

Lumix serves self-directed Stellar traders who need to compare and execute spot swaps across multiple liquidity venues from a connected wallet. The primary Spot-page user and workflow are inferred from the supplied implementation brief.

## Product Purpose

Lumix provides a focused trading workspace for finding and reviewing routed Stellar liquidity. For Spot, success means a trader can understand the assets, executable estimate, route, freshness, fees, wallet prerequisites, and minimum received before approving a transaction.

## Positioning

Lumix presents best execution across Soroswap, Aquarius, and Stellar DEX, including transparent split routing and comparable alternatives rather than hiding venue composition behind a single quoted price.

## Operating Context

Users work from a non-custodial wallet and must account for available balances, Stellar trustlines, asset authorization, quote expiry, slippage, and ledger submission states. The initial implementation is an interactive local-data prototype; wallet prompts and ledger progress are simulated.

## Capabilities and Constraints

- Build only the shared application shell and `/spot`; other products appear in navigation but have no pages.
- The Spot ticket supports asset selection, amount entry, MAX, direction reversal, slippage control, route expansion, alternative route selection, review, and simulated transaction progression.
- Required exception states are insufficient balance, unavailable liquidity, stale quote, missing trustline, and asset authorization required. User inputs persist across errors.
- Mock data must be realistic, but there is no backend, database, Stellar SDK, wallet SDK, or external API integration.
- Desktop uses a prominent swap ticket beside route information. Tablet and phone layouts stack without horizontal page overflow and keep the primary action accessible.

## Brand Commitments

The product name is Lumix. Use the existing Lumix icon and wordmark assets from `design-system/assets/`. Extend the existing dark trading design system; do not introduce a separate visual direction.

## Evidence on Hand

- `design-system/README.md` and `_ds_manifest.json` define the system purpose and inventory.
- `design-system/tokens/` defines the working dark palette, typography, spacing, and motion.
- `design-system/components/components.css` supplies the reusable component classes.
- `design-system/patterns/` defines Spot anatomy, transaction states, wallet prerequisites, and responsive behavior.
- `design-system/assets/` contains the available Lumix brand marks.
- Financial figures in the application are illustrative mock data; no production protocol parameters or performance claims are available and none should be fabricated.

## Product Principles

- Make capital, spendable balance, and transaction cost legible before commitment.
- Put route quality, quote freshness, and minimum received in the decision path.
- Explain prerequisites and failures precisely while preserving the trader's intent.
- Keep advanced venue composition one layer away without obscuring best execution.
- Use explicit labels and persistent states rather than relying on color or transient notices.

## Accessibility & Inclusion

Meet the design system's WCAG 2.2 AA baseline for actionable and decision-critical text. Use semantic controls, visible focus, at least 44px touch targets on compact layouts, reduced-motion support, and text labels in addition to color for financial and status meaning.
