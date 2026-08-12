---
name: Lumix
description: A calm, inspectable dark-default trading system with a composed light mode for transparent non-custodial execution.
colors:
  primary: "#2E5CFF"
  primary-hover: "#1E48E6"
  primary-tint: "#0F1730"
  primary-text: "#8FA6FF"
  canvas: "#0A0A0B"
  surface: "#141416"
  raised: "#1C1C1F"
  border: "#2A2A2D"
  text-primary: "#F4F4F5"
  text-secondary: "#A1A1A6"
  text-muted: "#85858B"
  text-disabled: "#6E6E73"
  white: "#FFFFFF"
  positive: "#35C46A"
  positive-tint: "#10241A"
  negative: "#F0524B"
  negative-tint: "#241214"
  warning: "#FFBA00"
  warning-tint: "rgba(255, 186, 0, 0.12)"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.06em"
  data:
    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums slashed-zero"
  data-large:
    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
    fontFeature: "tabular-nums slashed-zero"
rounded:
  xs: "4px"
  sm: "8px"
  md: "10px"
  control: "12px"
  panel: "16px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
  "20": "80px"
  "24": "96px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  input-amount:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.data-large}"
    rounded: "{rounded.control}"
    padding: "16px"
  navigation-active:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  badge-info:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "24px"
  card-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "20px"
  alert-warning:
    backgroundColor: "{colors.warning-tint}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  segmented-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "28px"
---

# Design System: Lumix

## Overview

**Creative North Star: "The Quiet Ledger"**

Lumix is a calm, exact trading environment: controlled enough to keep attention on capital and intent, structured enough to make complex financial state inspectable, and restrained enough that a focused action never becomes a crowded terminal. The interface behaves like a well-kept ledger—compact, legible, and explicit about what can move, what it costs, and what happens next.

The system is a dark-default extension of Lumix's established Poly Blue and Pure Gray world with a separately composed light mode. Quiet one-pixel borders and tonal surface steps carry most hierarchy in either theme; blue appears as transactional punctuation, while green, red, and amber retain precise financial or status meaning. Controls feel compact and gently raised, labels stay in Inter, and exact financial values switch to tabular monospace.

**Key Characteristics:**

- Dark-default near-black canvas and a cool, low-glare light canvas using the same semantic surface ladder.
- Poly Blue reserved for primary actions, focus, selection, and inspectable data emphasis.
- Comfortable-dense layouts with advanced evidence one layer away.
- Inter interface copy paired with tabular monospace financial values.
- Persistent, labeled transaction and exception states rather than color-only signals.

## Colors

The palette is deliberately neutral-first: the Pure Gray ladder builds the workspace, while Poly Blue and semantic colors signal action or meaning with controlled rarity.

### Primary

- **Poly Blue** (`#2E5CFF`): Primary transaction controls, focus, selected states, and the leading data series.
- **Pressed Poly Blue** (`#1E48E6`): Hover and active treatment for filled primary controls.
- **Midnight Blue Tint** (`#0F1730`): Selected or highlighted surfaces that need blue meaning without visual volume.
- **Instrument Blue** (`#8FA6FF`): Readable blue text, icons, and secondary data emphasis on dark surfaces.

### Secondary

- **Ledger Green** (`#35C46A`) and **Deep Green Tint** (`#10241A`): Positive, completion, long, call, and profit states.
- **Reserve Amber** (`#FFBA00`) and **Reserve Amber Tint** (`rgba(255, 186, 0, 0.12)`): Stale, delayed, pending, capacity-limited, or risk-warning states.

### Tertiary

- **Ledger Red** (`#F0524B`) and **Deep Red Tint** (`#241214`): Negative, destructive, short, put, loss, and error states.

### Neutral

- **Canvas Black** (`#0A0A0B`): The page background and deepest inset plane.
- **Pure Gray Surface** (`#141416`): Cards, panels, bars, and the primary application chrome.
- **Raised Pure Gray** (`#1C1C1F`): Inputs, selected navigation, nested metrics, and compact raised controls.
- **Quiet Divider** (`#2A2A2D`): One-pixel borders, rules, seams, and table separation.
- **Primary Ink** (`#F4F4F5`): Decision-critical labels and dominant values.
- **Secondary Ink** (`#A1A1A6`): Supporting labels and explanatory copy.
- **Readable Muted Ink** (`#85858B`): Small metadata and helper copy that must remain AA-readable.
- **Legacy Muted Ink** (`#6E6E73`): Disabled states and non-text decoration only; it is not valid for critical small copy.
- **Action White** (`#FFFFFF`): Text on filled Poly Blue controls.

### Light Theme Mapping

- **Canvas / Surface / Raised:** `#F6F6F8` / `#FFFFFF` / `#EEEEF2` preserve the same tonal hierarchy without mechanically inverting the dark theme.
- **Primary / Secondary / Muted Ink:** `#17171A` / `#4F4F59` / `#696974` keep dense financial copy AA-readable.
- **Action Poly Blue:** `#244DE0`, with `#1D3FBD` hover and `#173497` active states, remains scarce transactional punctuation.
- **Positive / Negative / Warning:** `#167441` / `#A93430` / `#9A6500` are independently tuned for light surfaces and retain labels or icons as non-color cues.
- The root `data-theme` attribute is the only theme switch; components consume semantic `--trade-*` roles and never branch on page-specific color values.

### Named Rules

**The 95% Neutral Rule.** Approximately 95% of a screen stays neutral in either theme; Poly Blue is scarce transactional punctuation, not ambient decoration.

**The Meaning Before Hue Rule.** Green, red, and amber always reinforce a label, sign, position, or persistent status; color never carries financial meaning alone.

## Typography

**Display Font:** Inter (with Apple system, Segoe UI, and sans-serif fallbacks)  
**Body Font:** Inter (with Apple system, Segoe UI, and sans-serif fallbacks)  
**Label/Mono Font:** System monospace (SFMono-Regular, Menlo, Monaco, and Consolas fallbacks)

**Character:** Inter keeps the interface direct and compact without adopting a decorative finance aesthetic. Monospace appears only where exact comparison matters, turning balances, prices, timers, hashes, and aligned numeric columns into reliable instruments.

### Hierarchy

- **Display** (700, 64px, 1.08): Documentation and future high-level brand moments; never needed to inflate ordinary product screens.
- **Headline** (700, 36px, 1.18): Major product or section introductions where a large hierarchy is warranted.
- **Title** (600, 22px, 1.3): Page and panel-level headings inside the application shell.
- **Body** (400, 16px, 1.6): Explanations and ordinary prose; dense component copy typically steps down to 14px.
- **Label** (600, 12px, 0.06em tracking): Compact metadata and table headers; uppercase is reserved for true overlines and column headings.
- **Data** (600–700, 13–28px, tabular figures): User-facing financial values use `en-US` grouping and exactly two decimals; calculations and decimal editing retain their internal precision until display. This role covers prices, balances, outputs, fees, countdowns, addresses, hashes, and directly comparable numeric columns.

### Named Rules

**The Number Column Rule.** Comparable financial values are right-aligned, tabular, grouped, and shown with exactly two decimals while internal calculation and editable precision remain intact; prose and navigation stay in Inter.

## Layout

Lumix uses an 8px rhythm with a 4px half-step. Standard panels carry 20px internal padding, close grids use 12–16px gaps, and major sections expand through the larger scale rather than arbitrary values. The application shell is capped at 80rem with a sticky 56px header; wide operating surfaces may pair a flexible main area with an approximately 20rem action rail.

Desktop layouts expose comparison and action together when the relationship is decision-critical. At tablet and narrow-desktop widths, columns stack before either becomes cramped. Below 768px, navigation reduces to the highest-frequency actions, transactional targets grow to at least 44px, and secondary detail collapses or moves into overlays; below 640px, controls and data reflow without horizontal page overflow. Sticky commits are allowed on compact screens only when they do not cover fees, warnings, or prerequisites.

**The One-Layer-Away Rule.** Keep decision-critical numbers in the primary scan path and make composition, methodology, and extended evidence available through one deliberate expansion.

## Elevation & Depth

The system is flat by default and uses tonal layering plus one-pixel borders to establish depth. Shadows are structural exceptions: a low control shadow confirms a selected segmented state, a compact tooltip shadow separates temporary detail, and the strongest ambient shadow belongs only to modals, drawers, and command overlays. Panels do not lift on hover.

### Shadow Vocabulary

- **Control confirmation** (`0 1px 3px rgba(0, 0, 0, 0.30)`): Selected segmented controls and similarly compact raised state.
- **Tooltip separation** (`0 4px 16px rgba(0, 0, 0, 0.40)`): Popovers and chart or field tooltips.
- **Overlay focus** (`0 24px 64px rgba(0, 0, 0, 0.50)`): Modals, drawers, and command search only.

### Named Rules

**The Tonal Depth Rule.** At rest, use surface contrast and quiet borders; shadows appear only when a temporary or selected layer must clearly sit above its context.

## Shapes

The form language is gently curved and compact. Primary panels use 16px corners, buttons and inputs use 12px corners, nested controls use 8–10px corners, and badges or asset selectors use a pill silhouette. Circular marks are reserved for assets, status dots, radios, and compact outcome symbols. One-pixel borders are part of the shape vocabulary, clarifying seams without turning the interface into a grid of boxes.

## Components

### Buttons

- **Shape:** Compact, gently raised controls with 12px corners; desktop controls are generally 36px high and large or touch controls are 44px high.
- **Primary:** Poly Blue fill, Action White text, and 16–20px horizontal padding. A primary button closes a review path or advances a transaction.
- **Hover / Focus:** Hover shifts to Pressed Poly Blue over 150ms. Keyboard focus uses a one-pixel Poly Blue outline plus a soft blue ring; disabled controls retain their label and reduce opacity.
- **Secondary / Ghost:** Secondary controls use Raised Pure Gray with a quiet border; ghost controls remain transparent until hover. Neither competes with the single primary commit.

### Chips

- **Style:** 24px pill badges use a tinted semantic background, 12px semibold text, and an optional 6px current-color status dot.
- **State:** Selected, live, warning, error, and informational variants always keep an explicit text label; pulsing is reserved for genuinely live status.

### Cards / Containers

- **Corner Style:** Gently rounded panels (16px) and nested containers (12px).
- **Background:** Pure Gray Surface for the primary plane, Raised Pure Gray for nested metrics and fields, and Canvas Black for deep insets.
- **Shadow Strategy:** Flat at rest; reference the structural exceptions in Elevation & Depth.
- **Border:** One-pixel Quiet Divider by default, strengthened only for hover, focus, or semantic warning.
- **Internal Padding:** 20px for ordinary panels, 16px for compact panels, and 24px for roomy documentation specimens.

### Inputs / Fields

- **Style:** Raised Pure Gray fill, one-pixel border, 12px corners, and compact metadata placed above or beside the value.
- **Focus:** Border shifts to Poly Blue with a soft three-pixel ring; the field must remain visually stable.
- **Error / Disabled:** Error and warning shift the border and pair it with persistent explanatory copy. Disabled or unavailable values use a label or em dash, never a fabricated zero.
- **Financial Amounts:** Large values use bold tabular monospace; units, wallet balance, fiat context, and MAX remain present without ambiguous wrapping.
- **Calculated Values:** When Lumix owns the quote, show it as a calculated output rather than a manual field. If bounded price adjustments are offered, each state derives from one stable base value instead of compounding.

### Selection Controls

Use restrained raised segmented surfaces for short, mutually exclusive sets such as asset pair, direction, or expiration. Larger ordered sets remain on one non-wrapping horizontal rail with a visible quiet scrollbar; keep the active value in view, auto-center it when practical, and honor reduced-motion preferences.

### Financial Records

Comparison-rich records use semantic tables on wide screens, with tabular financial values aligned by column and explicit text labels for state. On compact screens, each row becomes a labeled record grid instead of a horizontally compressed table: preserve every column meaning beside its value, let the primary identity and available actions span the full row, and keep action targets at least 44px. State-filtered collections pair a semantic tab set with an announced result count and a direct empty-state label. Relative ages or countdowns may lead in the scan path, but the absolute timestamp remains available to assistive technology and on deliberate inspection.

### Navigation

Desktop navigation uses compact Inter labels in a sticky top bar. Default items are secondary ink, hover adds a quiet wash, and the active item sits on Raised Pure Gray. On compact screens, a fixed bottom bar exposes the highest-frequency destinations with labels and icons; less frequent destinations move into a bordered overlay.

### Transaction State

Review, prerequisite, signature, submission, confirmation, and completion form a visible lifecycle rather than a sequence of toasts. Persistent alerts and timelines name the current step, the financial intent, and the recovery action; the same state grammar applies to stale data, unavailable liquidity, wallet prerequisites, and failed transactions.

## Do's and Don'ts

### Do:

- **Do** use Poly Blue for the primary transaction, focus, selected navigation, and restrained data emphasis.
- **Do** keep available balance, fees, minimum outcome, and prerequisites legible before commitment.
- **Do** use Inter for interface structure, tabular monospace for exact financial comparison, and grouped two-decimal display for user-facing financial values while preserving internal precision.
- **Do** preserve user intent and show a precise recovery action when a quote, balance, trustline, authorization, or network state blocks progress.
- **Do** keep compact-screen targets at least 44px and honor reduced-motion preferences.

### Don't:

- **Don't** turn the neutral workspace into a field of blue cards, decorative gradients, or competing accents.
- **Don't** use green, red, or amber as decoration or as the only signal of direction, risk, or status.
- **Don't** use the legacy muted gray for critical small copy on dark surfaces.
- **Don't** add bounce, elastic easing, card lift, or press-scale effects; state transitions stay restrained and functional.
- **Don't** squeeze a multi-column terminal into phone width or hide the only failure reason, transaction reference, or recovery action in a toast.
