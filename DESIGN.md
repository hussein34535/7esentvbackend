# Design System — 7esen Admin

Single source of truth for all UI work. Every page MUST follow this. When in doubt, match `src/app/channels/page.tsx` (reference implementation of toolbar + card grid patterns).

## Theme: Dual — "Plain White Light" + "Deep Slate Dark"

Two themes via CSS variables flipped by a `.dark` class on `<html>` (toggle in sidebar, persisted in localStorage, defaults to system preference). All pages use semantic token utilities ONLY (`bg-surface`, `text-ink`, ...) so both themes work automatically — never hardcode light-only or dark-only colors in page code.

- **Light:** plain neutral white surfaces (zero tint), soft gray canvas.
- **Dark:** comfortable deep blue-gray (never pure black), brighter accent/badge foregrounds.
- Charts/inline styles that can't use Tailwind classes must reference `var(--surface)` / `var(--ink)` / `var(--line)` or pick dual-mode-safe constants (#10b981 green, #60a5fa blue, #94a3b8 ticks).

## Tokens (defined in `src/app/globals.css` via Tailwind v4 `@theme`)

Use these semantic utilities — NOT raw slate/emerald classes:

| Token | Utility examples | Use |
|---|---|---|
| `canvas` | `bg-canvas` | Page background |
| `surface` | `bg-surface` | Cards, panels, sidebar |
| `surface-2` | `bg-surface2` | Inputs, nested areas, hovers, chips |
| `line` | `border-line` | Hairline borders (1px) |
| `ink` | `text-ink` | Primary text, headings |
| `ink-soft` | `text-inksoft` | Secondary text |
| `ink-mute` | `text-inkmute` | Meta text (IDs, timestamps) — never body copy |
| `accent` | `bg-accent`, `text-accent` | Emerald: primary buttons, active nav, selection, links |
| `accent-strong` | `hover:bg-accentstrong` | Accent hover |
| `accent-soft` | `bg-accentsoft`, `border-accentline` | Selected card bg, soft badges |
| `danger` / `dangersoft` | `text-danger`, `bg-dangersoft` | Destructive actions |
| `warn` / `warnsoft` | VIP/premium badge, pending states |
| `info` / `infosoft` | Informational badges |

Fallback: default Tailwind palette allowed ONLY for one-off tints not covered above; prefer tokens.

## Typography

- System font stack (already set as `--font-sans`). One family everywhere.
- Page title: `text-xl md:text-2xl font-bold text-ink tracking-tight`. **NO gradient text** (`bg-clip-text text-transparent` is banned).
- Subtitle under title: `text-sm text-inksoft mt-1`.
- Card titles: `font-semibold text-ink`. Numbers/IDs: `tabular-nums`.
- No uppercase tracked eyebrows.

## Page scaffold (every list page)

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
  {/* Header row: title block left, actions right */}
  {/* Toolbar row: search input grows + sort select */}
  {/* Content */}
</div>
```

Header: `<h1>` solid ink; right side has primary action button (`+ Add X`) + optional Select/Reorder toggles.
Counter line under title: `{shown} of {total} items` in `text-xs md:text-sm text-inkmute`.

## Components vocabulary

### Buttons
- Primary: `bg-accent hover:bg-accentstrong text-white rounded-[10px] px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm`
- Secondary: `bg-surface border border-line hover:bg-surface2 text-ink rounded-[10px] ...same`
- Ghost icon button: `p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors`
- Danger: `bg-danger hover:bg-red-600 text-white` / ghost-danger `hover:text-danger hover:bg-dangersoft`
- Disabled: `disabled:opacity-40 disabled:pointer-events-none`
- ALL buttons get `focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none`.

### Cards
`bg-surface border border-line rounded-2xl p-4 md:p-5 transition-all duration-200`
Hover: `hover:border-accent/40 hover:shadow-cardhover`. Selected: `border-accent bg-accentsoft/50`.
Shadow only via token `shadow-card` (rest) / `shadow-cardhover` (hover). Never pair border ≥2px with big shadows.

### Inputs / Selects
`w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-9 pr-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors`
Search inputs have leading `Search` icon; clearable with trailing ✕ when non-empty.
Selects: same skin + custom chevron (`appearance-none` + absolute ChevronDown).

### Chips (filters)
Pill: `px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200`
Inactive: `bg-surface border-line text-inksoft hover:border-inkmute/40 hover:text-ink`
Active: `bg-accent border-accent text-white`
Row scrolls horizontally on mobile: `overflow-x-auto flex gap-2` with hidden scrollbar.

### Badges
Small pills: VIP = `bg-warnsoft text-warn`; premium star; status badges use matching *soft token pairs. Always icon or dot + label.

### Loading
Skeleton blocks: `bg-surface2 rounded-2xl animate-pulse` mimicking final layout. No spinners mid-content.

### Empty states
Centered: relevant lucide icon `w-10 h-10 text-inkmute/40`, message `text-sm text-inksoft`, action link/button in accent when applicable ("Clear filters", "Add your first X").

## Motion

- Standard: `duration-200` ease-out (Tailwind default curves fine). Press feedback: `active:scale-[0.98]` on buttons/cards.
- No page-load orchestration, no bounce/elastic, no decorative motion.
- Respect reduced motion (globals.css already neutralizes transforms/animations).

## Icons

Lucide only. Sizes: `w-4 h-4` inline, `w-5 h-5` nav/buttons, `w-6 h-6` feature icons in cards.

## Spacing & rhythm

Page paddings per scaffold. Section gaps `mb-6 md:mb-8`. Grid gaps `gap-4 md:gap-6`. Cards breathe: `p-4 md:p-5`. Don't cram toolbars against headers — `mb-4`.

## Brand gradient vocabulary (owner-mandated, from 7esen app hero)

- `.text-gradient-brand` — pink→red gradient text for page `<h1>` titles and the sidebar logo.
- `.btn-gradient-red` — red gradient + soft glow for PRIMARY actions (Add/Save/Create).
- `.btn-gradient-violet` — violet→pink gradient + glow for FETCH/IMPORT actions (جلب تلقائي, scrape).
- These classes live in globals.css; pair with `text-white rounded-[10px] px-4 py-2 ...` as usual.

## Bans (hard)

Side-stripe colored borders · glassmorphism cards (frosted blur allowed ONLY on sticky mobile header) · pure `#000` body backgrounds in light mode · neon glow outside the sanctioned gradient buttons · identical repeated hero cards · `border` + `shadow-lg`+ combos · radius > 16px on cards · custom scrollbars · new dependencies (lucide-react + existing stack only).

## Language

Mixed EN/AR stays as-is. Do not translate labels.

## Functionality rules

This is a reskin + UX polish pass. Preserve ALL existing logic: state handlers, server-action calls, select mode, bulk ops, drag-drop reorder, pagination, filters. Do not rename functions, change data flow, or edit `actions.ts`. Keep `'use client'` directives. Keep native `confirm()` dialogs.
