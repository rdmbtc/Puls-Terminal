## Goal

Turn the Flutter `MarketTerminalScreen` into an HTML/React preview using the chosen "Deep glass cyberpunk" direction, so you can view it in the Lovable preview at `/`.

Static presentation only — no backend, no live data, no Cloud. Data is inlined mock (BTC $100k, ETH flip, US recession, Fed cut, Arc TVL, SOL $300 markets + Vega/Lyra/Antigravity/Orion/Sirius agents).

## Design tokens (copied verbatim from selected prototype)

Added to `src/styles.css` under `@theme inline`:
- `--color-navy: #060913`
- `--color-teal: #2DD4BF`
- `--color-pink: #EC4899`
- `--color-glass: rgba(255,255,255,0.03)`
- `--color-glass-border: rgba(255,255,255,0.08)`
- `.cyber-grid` background pattern
- Inter + JetBrains Mono via `<link>` in `src/routes/__root.tsx` head

## Files

1. `src/routes/__root.tsx` — add Google Fonts `<link>` (Inter + JetBrains Mono).
2. `src/styles.css` — add color tokens + `.cyber-grid` utility.
3. `src/routes/index.tsx` — replace placeholder with `<TerminalPage />`, set head meta (title "Puls Terminal", description).
4. `src/components/terminal/TerminalPage.tsx` — full page composition.
5. `src/components/terminal/StatCard.tsx`, `MarketsTable.tsx`, `AgentCard.tsx`, `LiveEventsTicker.tsx` — small subcomponents.
6. `src/components/terminal/mock-data.ts` — markets + agents arrays.

## Composition (matches prototype exactly)

```text
┌───────────────────────────────────────────────────────────┐
│ Logo · PULS TERMINAL          [Overview|Live|Analytics|Markets|Agents] │
│ ┌──────┬──────┬──────┬──────┐                              │
│ │Vol   │Agents│OI    │Health│  (4 stat cards)              │
│ └──────┴──────┴──────┴──────┘                              │
├───────────────────────────────┬───────────────────────────┤
│ Active Prediction Markets     │ Top Performers            │
│ [table: market/YES/vol/agents │ [agent card × 3 with      │
│  /Trade × 6 rows]             │  sparkline bars + stats]  │
├───────────────────────────────┴───────────────────────────┤
│ ● LIVE EVENTS  Lyra ⌖ ... · Orion 🛰️ ... · Sirius 🌠 ... │
└───────────────────────────────────────────────────────────┘
```

- Cyber-grid background + two blurred teal/pink orbs
- All glass cards use `bg-glass border-glass-border backdrop-blur-md rounded-xl`
- Prices in JetBrains Mono, teal for YES > 0.5, pink otherwise
- Fixed bottom live-events ticker

## Out of scope

- Real API calls to `backendUrl`
- Route tabs actually switching content (single Overview view only)
- Trade actions
- Swarm visualizer canvas, market depth chart, x402 tracker (prototype v1 doesn't include these — sticking to the chosen direction)

## Verify

Build passes, preview at `/` renders the terminal without console errors.
