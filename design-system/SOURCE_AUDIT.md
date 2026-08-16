# Supplied-source audit

Both archives were inventoried and extracted only after path-traversal and symlink checks passed.

## Light-theme reference package

- File: `52c2f325-afbd-4300-97dd-29f6a1533c92.zip`.
- Entries: 23.
- Size: 41,635 bytes.
- SHA-256: `da90706271ae1ce43c35aa3b0a619348a87435339baca80f14e38ebb39f31917`.
- Treatment: `tokens/themes.css`, `tokens/primitives.css`, `tokens/tokens.json`, and `MIGRATION.md` were read directly from the archive. Its light values were mapped to the current `--trade-*` semantic roles while the current dark values remained unchanged.

## Current Lumix application archive

- File: `lumix2.zip`.
- Entries: 35.
- Size: 319,911 bytes.
- SHA-256: `7f2da542d81248e83a12a9ff80577bd6ee17bd432b3ebf63628341eb1f43cf10`.
- Result: byte-for-byte identical to the Lumix archive supplied in the preceding design-system pass.

Reviewed groups:

| Group | Files | Design evidence used |
| --- | --- | --- |
| Rendered page sources | `CreateMarket`, `Leaderboard`, `Markets`, `NotFound`, `Profile` `.dc.html` and standalone sources | Current application anatomy, transaction flow, portfolio/history structure, dense detail layout, empty/error behavior |
| Current design system | `_ds/.../readme.md`, `styles.css`, five token files, manifest, adherence rules, bundle | Current token API, components, documented visual discipline, runtime deviations |
| Theme | `shared/theme-light.css` | Evidence that the current implementation added a light theme despite the older dark-only direction |
| Assets | four logo PNGs plus two upload copies | Existing working brand assets; not hard-coded because final brand identity remains unresolved |
| Runtime | `support.js` | Generated page support only; excluded from the new stack-neutral system |
| Thumbnail | `.thumbnail` | Visual evidence of the current light market-detail implementation |

## Older design-system archive

- File: `1d1ebc08-9ef6-4bfc-8eaa-542cdd54f919.zip`.
- Entries: 25.
- Size: 332,391 bytes.

Reviewed files:

| File/group | Finding applied to v0.2.0 |
| --- | --- |
| `src/index.css` | Exact palette, Inter, radii, dark surfaces, scrollbar, selection, base visual language |
| `src/App.tsx` | 220px fixed sidebar, single active documentation section, 40×48px main padding, 1100px content width |
| `Foundations.tsx` | Full 64→12 type scale, color specimen anatomy, spacing and radius specimens |
| `Buttons.tsx` | Blue primary, raised secondary, ghost, tinted danger/success, 150ms hover, three sizes |
| `Inputs.tsx` | Raised fields, 12px radius, 9×13px inset, focus ring, select, toggle, checkbox, radio, slider |
| `Badges.tsx` | Pill anatomy, dot, compact sizes, live opacity pulse, status tints |
| `Cards.tsx` | 16px cards, 20px padding, stat/value hierarchy, highlighted wallet, notification anatomy |
| `Market.tsx` | Reusable two-direction selector, compact order panel, meter, countdown, metadata, activity structure |
| `Tables.tsx` | 11px uppercase headers, 13px rows, sorting, filter toolbar, selection, zebra/hover, pagination |
| `Charts.tsx` | Dashed 4–4 grids, muted axes, two-pixel series, restrained area fills, bar radius, tooltip elevation |
| `Navigation.tsx` | Raised active navigation, tabs, segmented control, breadcrumbs, command palette overlay |
| `shared.tsx` | 24px documentation cards, 40px subsection spacing, uppercase section labels |
| Palette PNG | Confirmed exact source hex values and grouping |
| Two SVG wrappers | Embedded bitmap wrappers; no additional vector geometry or token information |
| App/config files | React/Vite/Tailwind/Recharts/Lucide environment only; no additional product rules |

## Product brief

The complete supplied brief was read. Its product requirements—not the two reference applications—define the semantic system:

- routed spot swaps;
- standardized options with cashless exercise and fully collateralized sellers;
- custom option RFQs;
- GMX-style vault-backed perpetuals;
- pair-specific LP vaults with reserved, safety, free, and Blend-deployed capital;
- wallet, trustline, oracle, capacity, yield-risk, transaction, portfolio, and activity states;
- explicit treatment of every unresolved protocol parameter as configuration.

See `MIGRATION.md` for the visual and component mapping.
