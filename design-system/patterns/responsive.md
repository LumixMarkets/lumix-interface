# Responsive behavior

The product is desktop-first, but every action and position must remain understandable and manageable on compact screens.

## Layout ranges

| Range | Intent |
| --- | --- |
| `< 640px` | Compact phone action and portfolio views |
| `640–767px` | Large phone / compact tablet |
| `768–1023px` | Tablet and narrow desktop |
| `1024–1179px` | Desktop with stacked or narrow order rail |
| `≥ 1180px` | Full trading workspace |
| `≥ 1440px` | Wide terminal with denser comparative data |

Breakpoints are behavioral rather than device-brand targets.

## Navigation

- Desktop: persistent top product navigation plus wallet/settings utilities.
- Tablet: horizontally scrollable product navigation or consolidated products menu.
- Phone: four or five highest-frequency destinations in a bottom bar; remainder in `More`.
- Search becomes a full-width command/search overlay on compact screens.

## Trading workspace

### Desktop

- Chart and market information in the main column.
- Order/action rail at approximately 360px.
- Positions and orders below or in a lower terminal pane.
- Critical market context remains sticky where useful.

### Tablet

- Chart first.
- Action ticket below or in a drawer.
- Positions and orders as tabs.
- Preserve market, price, and oracle freshness while the action ticket is open.

### Phone

- Summary-first market header.
- Simplified chart.
- Sticky action bar opens a bottom sheet or dedicated full-screen flow.
- Current positions remain reachable without dismissing context.
- No multi-column terminal squeezed into phone width.

## Tables

Choose per table:

1. Horizontal scroll when cross-column comparison is essential, such as an options chain.
2. Column priority and hiding for secondary metadata.
3. Card/list transformation for independent rows, such as positions or RFQ quotes.
4. Dedicated detail surface for row actions.

Do not transform an options chain into unrelated cards if doing so destroys strike comparison. On phone, show one side at a time with a sticky strike/expiration context.

## Forms and tickets

- Desktop controls may be 36–40px high.
- Compact controls are at least 44px high.
- Numeric inputs keep unit, balance, and MAX accessible without wrapping ambiguously.
- Leverage sliders always retain direct numeric entry.
- Review and risk sections stack before the commit action.
- Primary commit action may be sticky at the bottom of a compact flow, but must not cover warnings or fees.

## Charts

- Reduce axis density before hiding essential series.
- Preserve exact tooltip values through tap interaction.
- Move legends below the chart on narrow screens.
- Keep oracle freshness outside the chart so it remains visible when the chart is simplified.
- Candlestick and implied-volatility surfaces may switch to a simplified line only when the user can explicitly restore the detailed view.

## Modals, drawers, and sheets

- Desktop: centered modal for confirmations; side drawer for secondary detail.
- Tablet: modal or bottom sheet depending on action complexity.
- Phone: full-height sheet for transactional flows; small alerts may remain modal.
- Use safe-area padding.
- Keep title, context, and close action visible while scrolling.

## Density modes

The default is comfortable-dense. A future compact mode may reduce row padding and panel gaps, but must not reduce:

- Font below the system minimum.
- Touch targets on compact layouts.
- Risk explanation spacing.
- Focus visibility.
- Transaction-state clarity.

## Content priority by product

### Spot

Keep pay, receive, best route, minimum received, price impact, and commit visible. Route composition can collapse.

### Options

Keep underlying, call/put, strike, expiration, premium, break-even, collateral/maximum loss, and commit visible. Greeks can collapse.

### Perpetuals

Keep side, collateral, leverage, size, entry, liquidation, fees, capacity, and commit visible. Extended rate math can collapse.

### Vaults

Keep TVL, share price, decomposed return sources, withdrawal state, risk, and deposit/withdraw actions visible. Historical attribution detail can expand.

### Portfolio

Keep total exposure, available balance, urgent risk/expiry items, and claimable/pending amounts visible. Product detail can move behind filters or tabs.
