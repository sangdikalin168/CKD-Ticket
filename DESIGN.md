---
name: CKD Ticket
description: The counter, played straight — the same conventional admin system as the till's back office, sharing its floor, its amber and its four marks.
colors:
  paper: "hsl(0 0% 100%)"
  chalk: "hsl(210 40% 98%)"
  wash: "hsl(210 40% 96.1%)"
  rule: "hsl(214.3 31.8% 91.4%)"
  floor: "#F5F6F8"
  ink: "hsl(222.2 47.4% 11.2%)"
  ink-deep: "hsl(222.2 84% 4.9%)"
  ink-soft: "hsl(215 16% 38%)"
  swim: "hsl(222 76% 50%)"
  gym: "hsl(146 80% 35%)"
  steam: "hsl(22 89% 50%)"
  combo: "hsl(261 75% 57%)"
  amber: "rgb(217 123 42)"
  amber-deep: "rgb(196 109 34)"
  amber-tint: "rgb(253 246 238)"
  paid: "rgb(5 150 105)"
  paid-tint: "rgb(236 253 245)"
  paid-deep: "rgb(4 120 87)"
  pending: "rgb(217 119 6)"
  pending-tint: "rgb(255 251 235)"
  pending-deep: "rgb(180 83 9)"
  void: "rgb(220 38 38)"
  void-tint: "rgb(254 242 242)"
  void-deep: "rgb(185 28 28)"
  notice: "rgb(37 99 235)"
  notice-tint: "rgb(239 246 255)"
  notice-deep: "rgb(29 78 216)"
typography:
  headline:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25rem
  label:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25rem
  caption:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0.02em"
  figure:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "'tnum' 1, 'zero' 1"
rounded:
  sm: "calc(0.5rem - 4px)"
  md: "calc(0.5rem - 2px)"
  lg: "0.5rem"
  full: "9999px"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-default:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-commit:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-commit-disabled:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink-soft}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  chip-paid:
    backgroundColor: "{colors.paid-tint}"
    textColor: "{colors.paid-deep}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  chip-pending:
    backgroundColor: "{colors.pending-tint}"
    textColor: "{colors.pending-deep}"
  chip-void:
    backgroundColor: "{colors.void-tint}"
    textColor: "{colors.void-deep}"
  chip-notice:
    backgroundColor: "{colors.notice-tint}"
    textColor: "{colors.notice-deep}"
  chip-muted:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink-soft}"
  price-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  table-header:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
    padding: "4px 8px"
---

# Design System: CKD Ticket

## Overview

**Creative North Star: "The Clean Counter, Shared"**

CKD Ticket is not its own visual world. It is the second application built to the same convention as CKD POS, sharing that system's floor (`#F5F6F8`), its cool white surfaces, its one hairline, its amber family mark, and its four semantic marks — the same numbers, defined in the same variable names, in both codebases. Where the till sells food across a counter, this app sells entry, memberships and coupons across a different counter for the same club; the owner asked, twice, that they read as one company's software rather than two designers' opinions, and the token layer is the mechanism that makes that literal rather than aspirational. A future agent extending either app inherits this system by default; a deliberate divergence is a decision to record here, not a shortcut to take silently.

This is the app's second visual identity. Its first attempt — a "Gym Whiteboard" of chalk-board surfaces, marker-weight type and four hue-coded magnets — was built, reviewed, and rejected outright; every trace of it (the board grid, the magnet vocabulary, `components/board/`) has been deleted from the codebase, and none of it is recorded below. What replaced it is conventional admin software played straight: a page header, a filter row, cards, a table. The craft is in the execution, not the invention — legible Khmer at counter distance, one committing action per screen, and a data table dense enough to hold a full day's sales above the fold on a 1366×768 laptop.

Two adjustments separate this build from its sibling, and both are Khmer-legibility commitments rather than taste: `--ink-soft` sits at 38% lightness here, darker than POS's 46.9% annotation, because Khmer's thinner strokes and stacked diacritics need the extra contrast to hold 4.5:1 at caption size; and the compact table's line height is 1.6 rather than a Latin-tuned 1.4, so a stacked Khmer consonant cluster doesn't crowd the row beneath it. Both are noted at their point of use below, not treated as a second design language.

**Key Characteristics:**
- Shares `--floor`, the amber pair and the four semantic marks with CKD POS byte-for-byte — one design system, two codebases
- Paper-white surfaces on the same cool grey floor, separated by a single 1px hairline
- One accent (amber `rgb(217 123 42)`) confined to the committing action, lettered in ink because white fails contrast on this ground
- Facilities demoted from a colour system to a quiet 8px dot beside a name; the price itself is always ink
- Four semantic marks — paid, pending, void, notice — one chip, one set of tones, matching POS's
- Roboto + Nokora, bundled locally; every comparable figure is tabular with a slashed zero
- `--ink-soft` held at 38% lightness and the caption line height at 1.6, both tuned for Khmer where POS's Latin-tuned values would fall short
- 36px controls, a 48px header, compact ledger tables — one density step down from POS's touch-first 40px/56px, because this is a seated laptop counter, not a standing tablet

## Colors

The same near-monochrome working palette as CKD POS: ink on paper on a grey floor, with one warm accent and four state hues that never carry decorative weight. Neutrals are stored as HSL triplets and consumed through `hsl(var(--x))`; the accent and the four marks are stored as RGB triplets consumed through `rgb(var(--x) / <alpha-value>)` — the same split, and the same numbers, POS uses, so both codebases hold one source of truth rather than two hand-copied palettes.

### Primary
- **The Family Mark** (`{colors.amber}`): The single accent, shared verbatim with CKD POS. It appears on exactly one thing per screen — the `commit` button variant (Sell, Approve and process, Sign in) — and on the price card currently mid-sale. It is not a heading colour, a link colour, a focus ring, or a "selected" wash on anything that doesn't commit money or a decision.
- **Family Mark Deep** (`{colors.amber-deep}`): The commit button's hover step, drawn as an inset underline rather than a ground change, and the border of a busy price card.
- **Family Mark Tint** (`{colors.amber-tint}`): The ground of a price card mid-sale; the one place the accent appears as a field rather than a mark.

### Secondary
The four marks, identical in hue and role to CKD POS. Each is a triple — hue, `-tint` ground, `-deep` text — rendered through one `Chip` and nothing else.

- **Paid** (`{colors.paid}` / tint `{colors.paid-tint}` / deep `{colors.paid-deep}`): Approved, processed, active, paid.
- **Pending** (`{colors.pending}` / tint `{colors.pending-tint}` / deep `{colors.pending-deep}`): Waiting on a decision — a hold or transfer request not yet resolved.
- **Void** (`{colors.void}` / tint `{colors.void-tint}` / deep `{colors.void-deep}`): Rejected, expired, failed — the same value backs every destructive control.
- **Notice** (`{colors.notice}` / tint `{colors.notice-tint}` / deep `{colors.notice-deep}`): Informational, neither good nor bad. A status string this app does not recognise falls here rather than inventing a fifth colour.

### Neutral
- **Ink** (`{colors.ink}`): Body text, the default button, the active nav row's text, the primary ground.
- **Ink Deep** (`{colors.ink-deep}`): Headings and the one focus ring.
- **Ink Soft** (`{colors.ink-soft}`): Metadata, placeholders, captions, disabled text — held at 38% lightness, not POS's 46.9%. See the Named Rule below.
- **Paper** (`{colors.paper}`): Every resting surface — cards, tables, the sidebar, the dialog, the price card.
- **Chalk** (`{colors.chalk}`): The label on ink.
- **Wash** (`{colors.wash}`): Header bands, row hover, skeletons, the disabled commit ground.
- **Rule** (`{colors.rule}`): The one hairline — every card edge, table divider, and input stroke.
- **Floor** (`{colors.floor}`): The app ground behind every white surface, identical to POS's counter colour.

### Facility marks
Swim, gym, steam and a combination colour still exist as tokens (`{colors.swim}`, `{colors.gym}`, `{colors.steam}`, `{colors.combo}`) but carry almost none of the weight they once did. `lib/facility.ts` is the one place a facility's colour is defined; every screen reads it from there rather than keeping its own copy, which is what let three pages disagree before this build.

### Named Rules

**The Amber Confinement Rule.** Amber marks one thing: the committing action, or a selected option standing in for one (the busy price card, mid-sale). It carries ink lettering, not white — white measures 3.1:1 on this amber and fails the contrast floor; ink measures 5.8:1. Disabled amber is never a faded amber; it is the wash ground with soft-ink text, because a faded accent under a pale label is unreadable exactly when the seller is deciding whether they can take the money. Audit test: point at any amber pixel and name the sale or approval it commits; if you can't, it's wrong.

**The Quiet Facility Rule.** A facility is a name with an 8px dot beside it, drawn from `lib/facility.ts`, and nothing more. It does not stripe a card, ground a tile, or colour a price — a swim ticket's price is ink, exactly like a gym ticket's, because gym's green and steam's orange do not clear 4.5:1 against white and a system that let facility colour carry the figure would be quietly inaccessible on its two most common products. The dot exists so a queue of prices reads left-to-right by colour before anyone reads the label; it stops there.

**The Ink-Soft-at-38 Rule.** `--ink-soft` is fixed at 38% lightness in this app, not the 46.9% CKD POS uses for the equivalent role. Khmer's thinner strokes and stacked diacritics read this system's secondary text at caption size constantly — a page header's date line, a table's row-number column, a chip's muted tone — and POS's lighter value would land at 4.6:1 where this one holds 6.58:1. This is the one deliberate divergence in the shared neutral ramp, made once in `index.css` rather than overridden per component.

## Typography

**Body Font:** Roboto (with Nokora, then system sans)
**Khmer Font:** Nokora — bundled locally via `@fontsource`, so the counter renders Khmer with no network dependency; the family stack asks for Roboto first, so Nokora's own Latin subset is never reached
**Figure Font:** Roboto's own tabular figures, reached through the `.figure` utility — not a separate mono face

**Character:** Roboto and Nokora are the same pairing CKD POS uses; a person reading a slip, a chip or a table on either app sees the same two typefaces at the same weights. Only four weights are bundled — Roboto 400/500/700 and Nokora 400/700 — because every screen in the interface sets one of those three Latin weights; a heading's `font-semibold` (600) has no matching cut and is rendered by the browser's nearest-weight fallback (700) rather than a true 600, a fact worth knowing before assuming the rendered weight matches the class name.

### Hierarchy
- **Headline** (600, 20px, 1.2): The page header's title line — always bilingual, Khmer first, then " · English" in soft ink when the two differ.
- **Title** (600, 18px, 1.375): A `Section` heading and a dialog title.
- **Body** (400, 14px, 20px line): Form fields, prose, button labels, card copy — the size that carries most of the interface.
- **Label** (500, 14px): Emphasis text that isn't a heading — a price card's product name, a table's bold parts.
- **Caption** (500, 12px, 1.6 line, 0.02em tracking): Metadata, chip text, table cells, the page header's date line. The 1.6 line height is a Khmer-specific choice; see the Named Rule.
- **Figure** (varies, tabular + slashed zero): Not a size but a treatment — see below.

### Named Rules

**The Figure Rule.** Any number a person compares to another number — a price, a count, a time, a page number — carries the `.figure` utility: `font-variant-numeric: tabular-nums slashed-zero` plus the matching `font-feature-settings`. CKD POS routes the same category of number through JetBrains Mono; this app deliberately does not. A generic monospace gives a decimal point a full character cell, so `$1.50` renders as `$1 . 50` at display size — tried and rejected here. Roboto's own tabular figures with a slashed zero give the column alignment the treatment exists for, without a third bundled face and its network-free-fonts cost.

**The Caption-at-1.6 Rule.** The `caption` type step sets its line height at 1.6, not a Latin-tuned 1.4. Khmer stacks a subscript consonant (coeng) and below-vowels beneath the baseline; at 1.4 those marks crowd the descenders of the line below. The system's compact table cells go further still, to a hand-tuned 19px, for the same reason.

**The Khmer-First Header Rule.** `PageHeader` renders a page's title in Khmer first, with the English name following after "·" in soft ink only when the two strings actually differ. The counter reads Khmer; the owner reads either; nothing here defaults to English and demotes Khmer to a subtitle.

## Layout

**The shell.** A collapsible sidebar (16rem expanded, 3rem as an icon rail, an off-canvas sheet below the `md` breakpoint) sits beside a fixed 48px header carrying the sidebar toggle, a breadcrumb, the language switcher and the user menu — one row shorter than POS's 56px, because this app's controls run a step smaller throughout. The sidebar collapses and expands with the `Ctrl/Cmd+B` shortcut, mirroring POS's shell exactly. Content sits on `{colors.floor}` with page padding, never a card of its own; every screen's real content is white cards and tables on that grey ground.

**The counter (Ticket.tsx).** A `PageHeader` naming the club and the date, then a Khmer-first tab strip (underlined, not boxed) for facility groups, a responsive grid of `PriceCard`s beneath each tab, and today's sales as a compact `DataTable` directly below — its first rows land above the fold on a 1366×768 laptop, which is the reference screen throughout the product.

**Requests.** `RequestColumns` lays out a request queue as three plain columns — requested, checked, processed — each a heading with its live count and a stack of white cards. Nothing carries a shadow, and nothing animates in when a card changes column; it simply renders where it now belongs.

**Density.** Controls are 36px by default (POS runs the same variants at 40px, sized for a standing tablet cashier; this app's counter staff are seated at a laptop). The compact table density is the default here, not an opt-in — roughly 40% more rows on screen than the comfortable step, achieved with hairline column rules instead of zebra striping, sentence-case headers, and a hand-tuned 19px row height for Khmer.

**Responsive.** Below `md`, the sidebar becomes a Sheet and `DataTable` drops its grid for stacked label/value cards, matching POS's table behaviour exactly.

## Elevation & Depth

Flat at rest, identical to CKD POS. No card, table, chip, price card or sidebar item carries a shadow while it is part of the page; hover and press are expressed as a ground shift (to `wash`, then deeper) rather than a lift. The one `overlay` shadow (`box-shadow: 0 12px 32px rgb(0 0 0 / 0.12)`) exists for exactly the things that float above an inert page — the dialog panel — the same single-meaning rule POS records as its Flat-At-Rest doctrine.

### Named Rules

**The Flat-At-Rest Rule.** Shadow means "this is floating above the page and the page beneath it is inert." Nothing at rest carries one; the dialog is the only surface that does.

## Shapes

The same radius ladder as CKD POS, scaled to this app's smaller components: `calc(0.5rem - 4px)` on the smallest controls, `calc(0.5rem - 2px)` on ordinary controls, `0.5rem` (8px) on cards, tables and the dialog, and full round reserved for chips, the state dot, avatars and the facility dot — things that are conceptually a token rather than a container. Borders are always the one 1px hairline; nothing in the system carries a second border weight or a second border colour.

## Components

### Buttons
- **Shape:** 8px-ish rounding (`calc(0.5rem - 2px)`), 36px default height — a laptop-scale control, one size step below POS's 40px equivalent.
- **Default:** Ink ground, chalk label — the ordinary primary action.
- **Commit (the signature variant):** Amber ground, ink label, at most one per screen (Sell, Approve and process, Sign in). Hover draws the deep amber as an inset underline rather than swapping the ground; active fills solid with the deep step. Disabled is the wash ground with soft-ink text, never a faded amber.
- **Commit Outline:** A tint-and-border reading of the same commitment, for a secondary confirming action beside a primary one.
- **Paid / Destructive:** The two decisions a request flow needs — solid paid-green or solid void-red with a chalk label.
- **Outline / Secondary / Ghost / Link:** The workhorse secondaries — hairline-bordered paper, wash-ground, text-only, and underline-on-hover respectively.
- **Focus:** One ring everywhere — 2px ink at 2px offset, keyboard-only via `:focus-visible`.

### Chips
One chip for the whole app, ported from CKD POS with the same four tones and the same roles, so a paid sale reads identically at the till and at the counter. Fully round, caption type, a tint ground with the mark's deep text step. `muted` carries a label that isn't a state (an age group, a tag, a count); `ink` is the one solid-emphasis chip. A `mono` flag routes the label's figures through `.figure`. `StateDot` is the same four tones as a flat 8px dot with no label, for a list of steps where a chip's own text would repeat the line it sits on.

### Cards / Containers
- **Corner Style:** 8px (`{rounded.lg}`).
- **Background:** Paper-white, on the floor.
- **Shadow Strategy:** None. See Elevation & Depth.
- **Border:** One hairline.
- **Internal Padding:** 16px in the card primitive; a price card runs tighter at 12px.

### PriceCard (signature component)
One sellable price: a white card with one hairline, the facility set named in ink (wrapping to two lines rather than truncating, because a tap-to-sell target has to say what it sells), the entitlement in caption beneath, and the price itself in a 24px tabular ink figure — never coloured by facility. The whole card is the tap target; there is no button nested inside it, because a grid of ten prices each carrying its own amber button would turn the one accent into wallpaper. At rest it is flat; hover tints the ground, press deepens it, and the card mid-sale is the one place amber appears on this surface, with a spinner riding beside the price.

### FigureStrip (signature component)
Ported verbatim from CKD POS: the system's answer to a grid of same-size stat cards. One white bar, ruled into 1–6 cells by hairline gaps, each cell putting a large tabular figure on the same baseline as its label, with an optional caption line beneath. A page that wants three numbers — today's tickets, members, income — gets one bar with three cells, never three cards.

### RequestColumns (signature component)
Three plain columns for a request's stages, each a heading with a live `Chip`-mono count and a stack of white, hairline-bordered cards. A card carries a title, an optional subtitle, up to a few metadata lines, a state chip, and a foot of action buttons behind its own hairline. Nothing here animates a card between columns or elevates one on hover beyond the ordinary wash tint.

### FacilityMark / FacilityDot
The one facility rendering: an 8px solid dot in the facility's colour, drawn from `lib/facility.ts`, followed by the facility's i18n name. Multiple facilities on one product render as a row of dots followed by their names joined with " + ". No facility system renders its own colour independently of this module.

### DataTable (signature component)
The counter's spine, shared in shape with CKD POS's back-office table but defaulting to the compact density here rather than comfortable. A white card: an optional toolbar (search, filters, column visibility, density toggle, export/copy/print, an add button — rendered only when at least one control is present, so an all-off configuration never ships a dead 25px band), a wash header band in sentence case, hairline-divided rows with tabular figures, and a pagination band. Loading is skeleton rows shaped like the real table; empty and error states render in place of the body, never as a blank table shell. Below `md` it becomes stacked label/value cards.

### EmptyState
Ported from CKD POS: a round wash plate holding a drawn icon, the missing thing named, one line of caption explaining why, and the action that fills it — a bordered link with a trailing arrow, or any control the caller supplies. Used for a genuinely empty request queue and for the sidebar's "role not recognized" dead end alike.

### Sidebar
The app's index, built on the same primitives as CKD POS's: an offcanvas panel on desktop (16rem, collapsing to a 3rem icon rail) and a Sheet below `md`, toggled by the same `Ctrl/Cmd+B` shortcut. Menu items and their icons are looked up from one access table (see below) rather than hand-checked per screen; a group with sub-items auto-expands onto the active route. The footer holds the one destructive item, sign-out, in void-red on hover.

### Dialog
A white panel centred over a 50%-black scrim, 8px corners, the one `overlay` shadow, entering on a 200ms fade-and-rise. Header separated from the body by a hairline; footer holds the dialog's actions.

### Named Rules

**The One Chip Rule.** Record state renders through `Chip` with one of the four tones, or through `StateDot` when a label would repeat itself. No screen hand-rolls a badge with its own padding, radius or colour pair.

**The One Table Rule.** Every list of records — sales, prices, requests, reports — renders through `DataTable`. A page does not lay out its own `<table>` with its own header styling.

**The One Access Table Rule.** `lib/access.ts` is the only place a role's reach is decided. The sidebar's visible menu, the dashboard's quick actions and report links, and any future admin-only control all call `visibleMenu` or `canReachPath` against the same `MENU` table, so the menu and the rest of the app cannot disagree about what a role may do. An unresolved role (missing, blank, a retired name like "Kiosk") resolves to `null` and reaches nothing, rather than guessing.

**The Paper Slip Rule.** The printed slip (`components/ComponentToPrint/`) is paper, not screen: it sets its own explicit `Roboto, Nokora` font stack, and its layout is drawn in literal black-on-white — `text-black`, `border-black`, `bg-black` — rather than through `ink`, `rule`, `paper` or any other screen token. A thermal printer needs true black rules that won't fade and a fixed font declaration independent of whatever the screen's token layer does next; the slip is deliberately not wired to this system so that a future token change here can never silently soften a receipt.

## Do's and Don'ts

### Do:
- **Do** treat CKD POS's token names as the shared contract — `--floor`, `--amber`, `--paid`/`--pending`/`--void`/`--notice` and their tint/deep steps carry the same numbers in both apps. Extend the pair together when a value must change.
- **Do** confine amber to the one committing action on a screen, lettered in ink.
- **Do** put a facility's identity through `lib/facility.ts` — a dot and a name — and keep prices in ink regardless of facility.
- **Do** route every state through `Chip`/`StateDot` and every record list through `DataTable`.
- **Do** mark every comparable number with `.figure`.
- **Do** keep `--ink-soft` at 38% and the caption line height at 1.6 in this app; they are Khmer-legibility floors, not stylistic choices to relax.
- **Do** read and write role access exclusively through `lib/access.ts`.

### Don't:
- **Don't** stripe a card, a column, or a price with a facility colour. The dot names it; the ink prices it.
- **Don't** put a white or chalk label on the amber ground — the label is ink, and disabled amber is wash-on-soft-ink, never a fade.
- **Don't** invent a fifth state colour, or route a comparable number through anything but `.figure`.
- **Don't** wire the printed slip to screen tokens; it stays literal black-on-white with its own explicit font stack.
- **Don't** put a shadow on anything at rest — only the dialog floats.
- **Don't** reintroduce a board, a magnet, a marker weight, or any other trace of the app's first ("Gym Whiteboard") identity; it was reviewed and rejected, and nothing about it is a fallback.
- **Don't** diverge from CKD POS's shared tokens without recording why here and in POS's own DESIGN.md — the two are meant to read as one company's software, and a silent drift defeats the point of sharing the layer at all.
