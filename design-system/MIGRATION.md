# Reference comparison and migration

This revision was rebuilt from three sources:

1. the current Lumix application archive;
2. the supplied older React design-system explorer;
3. the Stellar trading and derivatives product brief.

The current application archive is byte-for-byte identical to the previously supplied Lumix archive. It contributes current page anatomy, light implementation evidence, wallet patterns, generated component bundle, and logo assets. The older React explorer is the visual target for this revision. The product brief is the sole source of product semantics.

## Visual comparison

| Dimension | Older visual source | Version 0.1.0 | Version 0.2.0 decision |
| --- | --- | --- | --- |
| Theme | Dark-only explorer | Dark + light | Dark remains default; the current light semantic mapping is restored without changing the dark theme |
| Palette | Exact 15-token dark palette plus pending amber | Expanded gray and categorical scales | Exact source palette restored; one readable muted alias retained for AA |
| Primary button | Poly Blue fill | Neutral fill by default | Poly Blue fill restored |
| Type scale | 64/48/36/28/22/18/16/14/12 | Compressed 48/32/24/18/16/14/13/12 | Original scale restored |
| Documentation layout | 220px sidebar; one section at a time; 1100px content | Sticky top navigation; long page | Sidebar explorer restored |
| Cards | 16px radius; 20–24px padding | 16px radius; 16–20px padding | Older proportions restored |
| Inputs | Raised surface; 12px radius; 9×13px inset | Taller 44px baseline | Older visual inset restored; 44px retained on compact touch layouts |
| Tables | 13px rows; 11px uppercase headers | 14px rows; 12px headers | Older density restored |
| Charts | 4–4 grids; 2px series; restrained area fills | Placeholders and broader semantic palette | Canvas specimens reproduce older chart treatment with trading data |
| Shadows | Segmented control, tooltip, command palette only | Overlays only | Older restrained exceptions restored |
| Color meaning | Green/red tied to binary sides | Green/red remapped to financial roles | Long/call/profit and short/put/loss only |

## Product component migration

| Source anatomy | New component | Product use |
| --- | --- | --- |
| Market card | `InstrumentCard`, `OptionContractCard`, `VaultCard` | Pair, contract, position, or vault summary |
| Two-side market buttons | `DirectionSelector` | Long/short or call/put with explicit labels |
| Probability bar | `CapacityMeter`, `CapitalStack` | Market utilization and vault buckets |
| Order panel | Product ticket family | Spot swap, option buy/write, RFQ, perpetual order |
| Odds summary | `QuoteSummary`, `RiskSummary` | Premium, break-even, collateral, liquidation, capacity |
| Market table | `OptionsChain`, `RFQQuoteTable`, `PositionTable`, `VaultTable` | Comparable executable financial data |
| Activity feed | `ActivityFeed` | Orders, fills, RFQs, exercises, settlements, vault events |
| Time remaining | `Countdown` | RFQ expiry, option expiry, settlement, withdrawal window |
| Creator identity | `CounterpartyIdentity` | RFQ writer identity or reputation context only |
| Portfolio card | `PortfolioSummary` | Cross-product exposure, realized/unrealized PnL, reserved funds |
| Wallet card | `WalletSummary` | Balances, trustlines, authorization, reserved and claimable amounts |
| Probability chart | `PriceChart`, `IVChart` | Market price and implied volatility |
| Category donut | `ExposureBreakdown` | Product, asset, collateral, or vault exposure |

## Product patterns retained from the current application

- compact header and wallet affordance;
- dense table/search/filter structure;
- detail surface with chart and right-side transaction rail;
- multi-step review → wallet signature → ledger result flows;
- portfolio summary and history anatomy;
- mobile transaction-sheet thinking;
- loading, empty, error, and not-found patterns.

## Product concepts explicitly retired

- event questions and binary outcome pricing;
- market resolution and creator-fee concepts;
- binary bet-ticket vocabulary;
- public ranking/leaderboard logic;
- probability-as-price framing;
- any assumption that the perpetual vault writes options;
- any claim that trader losses or Blend yield are guaranteed returns.

## Unresolved decisions remain configuration

The component system exposes slots for product configuration instead of silently fixing:

- launch markets, leverage, fees, oracle, and settlement rules;
- option strikes, expirations, contract sizes, and covered-call settlement asset;
- vault ratios, safety buffer, Blend allocation cap, and withdrawal queue;
- insurance reserve size;
- option-writing vault and yield-wrapper launch scope.

The specimen labels realistic numbers as examples. Production components must load those values from product or protocol configuration.
