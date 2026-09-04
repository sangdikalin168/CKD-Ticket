---
name: CKD Ticket
description: The counter ledger of a gym and swimming pool club — a compact register for a laptop, one colour per facility, and a Khmer slip with a QR code torn off every sale.
colors:
  ink: "hsl(222.2 47.4% 11.2%)"
  ink-deep: "hsl(222.2 84% 4.9%)"
  paper: "hsl(0 0% 100%)"
  chalk: "hsl(210 40% 98%)"
  rule: "hsl(214.3 31.8% 91.4%)"
  wash: "hsl(210 40% 96.1%)"
  annotation: "hsl(215.4 16.3% 38%)"
  floor: "#F9FAFB"
  margin: "hsl(0 0% 98%)"
  margin-ink: "hsl(240 5.3% 26.1%)"
  margin-wash: "hsl(240 4.8% 95.9%)"
  success: "hsl(142 76% 36%)"
  warning: "hsl(41 96% 40%)"
  info: "hsl(217 83% 53%)"
  stop: "hsl(0 84.2% 60.2%)"
  swim: "#2563EB"
  swim-tint: "#DBEAFE"
  swim-ink: "#1D4ED8"
  gym: "#16A34A"
  gym-tint: "#DCFCE7"
  gym-ink: "#15803D"
  steam: "#EA580C"
  steam-tint: "#FFEDD5"
  steam-ink: "#C2410C"
  combo: "#9333EA"
  combo-tint: "#F3E8FF"
  combo-ink: "#7E22CE"
  amber: "#D97B2A"
  amber-deep: "#C46D22"
typography:
  display:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
  caption:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0.02em"
  figure:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    fontFeature: "'tnum' 1"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "hsl(222.2 47.4% 11.2% / 0.9)"
    textColor: "{colors.chalk}"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "32px"
  button-destructive:
    backgroundColor: "{colors.stop}"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "32px"
  input-default:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "32px"
    width: "100%"
  card-default:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.xl}"
    padding: "24px"
  ticket-tile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.display}"
    rounded: "{rounded.xl}"
    padding: "12px"
    height: "128px"
  chip-swim:
    backgroundColor: "{colors.swim-tint}"
    textColor: "{colors.swim-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  chip-gym:
    backgroundColor: "{colors.gym-tint}"
    textColor: "{colors.gym-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  chip-steam:
    backgroundColor: "{colors.steam-tint}"
    textColor: "{colors.steam-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  chip-combo:
    backgroundColor: "{colors.combo-tint}"
    textColor: "{colors.combo-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  table-header-cell:
    backgroundColor: "hsl(210 40% 96.1% / 0.5)"
    textColor: "{colors.annotation}"
    typography: "{typography.caption}"
    padding: "6px 12px"
  table-row-hover:
    backgroundColor: "hsl(210 40% 96.1% / 0.5)"
    textColor: "{colors.ink-deep}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.margin-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-item-active:
    backgroundColor: "{colors.margin-wash}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  print-slip:
    backgroundColor: "{colors.paper}"
    textColor: "#000000"
    typography: "{typography.body}"
    rounded: "0"
    padding: "16px"
    width: "405px"
---

# Design System: CKD Ticket

## Overview

**Creative North Star: "The Counter Ledger"**

The artifact at the centre of this product is the ledger kept at the club's
front desk: every sale a line, every member a page, and a slip torn off and
handed over with each entry. The interface is that ledger made electronic for
a laptop — ruled, compact, unembarrassed about being full of figures — and the
slip is still real: a Khmer receipt with a QR code that the gate reads. Where
NAN HR's register tracks days and hours, this one tracks entries and dollars,
and it inherits the same near-monochrome slate register to do it.

Two things distinguish it from its siblings. First, the scale: the reference
screen is a 1366×768 laptop at a counter with a queue, so controls are 32px,
the content pane pads at 12px, and tables have a compact "ledger" density
tuned line by line for Khmer. Second, the colour: the club has three
facilities — swim, gym, steam — and a combination package, and each has a
colour that staff read faster than a name. Blue, green, orange and purple are
the ledger's index tabs, used on ticket tiles, price rows and chips, and they
are the only saturated system beyond the four record-state marks.

The type system is built for Khmer first: Roboto and Nokora bundled offline,
secondary text darkened until it clears 6.5:1 on white, and a caption step
with a taller line so stacked Khmer consonants never touch. On paper the same
care becomes a HarfBuzz-shaped Noto Sans Khmer on 80mm thermal roll.

**Key Characteristics:**

- Ruled, not boxed — hairline dividers and a wash band do the separating work
- Compact by design: a 32px control scale and a ledger table density for a laptop
- Four facility colours as index tabs, four record-state marks, nothing else saturated
- Khmer-tuned contrast and line height, on screen and on the printed slip
- One amber mark, on the sign-in surface only — the family mark, not the club's
- Flat at rest, sticky header, offcanvas sidebar with an icon rail

## Colors

A near-monochrome cool-slate register on a pale floor, carrying four facility
colours that name a product and four semantic marks that name a record's
state.

### Primary

- **Register Ink** (`{colors.ink}`): The near-black cool slate for primary
  buttons, the active navigation label and headings. Slightly toward navy so
  it reads as ink.
- **Deep Ink** (`{colors.ink-deep}`): Body text and the focus ring — the
  highest-contrast thing on the page.

### Secondary

- **Wash** (`{colors.wash}`): Table header bands at 50% alpha, hovered rows,
  secondary buttons, the resting ground of ghost controls.
- **Annotation Grey** (`{colors.annotation}`): Metadata voice — column
  headers, helper text, placeholders, timestamps. Darkened from shadcn's
  46.9% to 38% lightness so Khmer at caption size clears 6.5:1 on white. This
  value is a commitment.
- **Floor** (`{colors.floor}`): The app background behind the cards —
  Tailwind's `gray-50`, used as a literal class on the content inset. It is
  the one place the raw grey palette is sanctioned as chrome.

### Tertiary

The index tabs, and the family mark.

- **Swim Blue** (`{colors.swim}`), **Gym Green** (`{colors.gym}`),
  **Steam Orange** (`{colors.steam}`), **Combo Purple** (`{colors.combo}`):
  Which facility a ticket, package or price row grants. Each comes with a
  tint (`-tint`, the 100 step) for chip and tile grounds and an ink (`-ink`,
  the 700 step) for text on that tint. They are Tailwind steps today, defined
  three times over in three pages; they should be defined once.
- **Amber** (`{colors.amber}`) and **Amber Deep** (`{colors.amber-deep}`):
  The sign-in button and its hover, with the logo's pale plate. The same
  amber CKD POS uses for its till — the family mark of these systems. It
  appears nowhere inside the app.

### Neutral

- **Paper** (`{colors.paper}`): Cards, tables, the header, the slip. Pure
  white.
- **Chalk** (`{colors.chalk}`): Text on Register Ink and on semantic fills.
- **Rule** (`{colors.rule}`): The single hairline — borders, input strokes,
  row dividers.
- **Margin** (`{colors.margin}`), **Margin Ink** (`{colors.margin-ink}`),
  **Margin Wash** (`{colors.margin-wash}`): The sidebar's own muted trio, so
  navigation reads as the ledger's margin rather than another data surface.

### Semantic marks

The four marks encode the state of a record, never decoration. They exist as
tokens — `--success`, `--warning`, `--info`, `--destructive` — with matching
button variants.

- **Success** (`{colors.success}`): Paid, approved, processed, active, in
  stock.
- **Warning** (`{colors.warning}`): Pending — a hold or transfer request
  awaiting a checker or an approver; a membership about to expire.
- **Info** (`{colors.info}`): Informational — a scheduled hold, a
  system-generated line, a link.
- **Stop** (`{colors.stop}`): Rejected, cancelled, expired, destructive
  action, validation failure. The sign-out control in the sidebar footer is
  rose for the same reason.

### Named Rules

**The Facility Rule.** Blue, green, orange and purple mean swim, gym, steam
and combination — on a ticket tile, a price row, a chip, a report column.
They are never chosen per page for variety. The three duplicate palettes in
`Ticket.tsx`, `TicketPriceConfig.tsx` and `MemberPriceTable.tsx` (one of which
reads a `badge` key that does not exist) are drift to collapse into one
definition.

**The Four Marks Rule.** Success, Warning, Info and Stop are the complete
state palette. A new record state maps onto one of them or is expressed in
ink and annotation grey.

**The Grey Ledger Rule.** Chrome is Floor and Paper. The two hundred raw
`gray-*` and ninety `black` classes in the pages are the same drift NAN HR
had: new work uses `bg-card`, `text-muted-foreground`, `border-border`, and a
page touched for other reasons is the moment to convert.

**The Legible Khmer Rule.** Annotation Grey stays at 38% lightness. Lightening
it back toward shadcn's default for Latin taste breaks Khmer at caption size,
and the detector currently finds no grey-on-colour defects here — keep it
that way.

**The One Amber Rule.** Amber marks the family's sign-in surface and nothing
inside the app. It is not a heading, a button variant, a chip or a "this
looks plain" fix.

**The Palette Restraint Rule.** No gradients on data surfaces. The indigo
gradient on the member profile header and the purple-to-pink banner and
purple heading in the customer-type report are the three "AI palette"
findings the detector raises today; they are drift, and a report tile is
Paper with a facility chip.

**The Dark Mirror Rule.** Every token has a `.dark` counterpart, and thirty-
four `dark:` utilities exist, but nothing enables dark mode and a stray
`.dark { @apply bg-gray-800 }` conflicts with the token. The app is light-only
in practice; do not design for dark here until the toggle exists.

## Typography

**Body Font:** Roboto (bundled, weights 300–900) with Nokora (bundled,
weights 100–900) as the Khmer face
**Print Font:** Noto Sans Khmer on the ESC/POS worker; Roboto with Khmer OS
Content in the browser print window

**Character:** A plain, high-legibility grotesque paired with a Khmer face
chosen for metric compatibility, both shipped with the app through
`@fontsource` so a counter with no internet renders the same as one with it.
A single global rule sets `'Roboto', 'Nokora', sans-serif` on every element.
There is no display serif; the loudest thing in the system is a price in
black weight on a ticket tile.

### Hierarchy

- **Display** (Roboto, 900, `1.875rem`, 1.1): The price on a ticket tile —
  `text-3xl font-black`, the one place the black weight belongs, so a cashier
  can read a price across the desk.
- **Title** (Roboto, 600, `1.125rem`, tight tracking): Card headings, dialog
  titles, and the club's name at the head of a printed slip.
- **Body** (Roboto, 400, `0.875rem`, 1.5): Table cells, form values,
  descriptions — the register voice, and by far the most used size.
- **Label** (Roboto, 500, `0.875rem`): Buttons, inputs, navigation items,
  tabs.
- **Caption** (Roboto, 500, `0.75rem`, 1.6, `0.02em`): The `text-caption`
  step — column headers in compact density, chip labels, eyebrows, the
  sidebar group label (which adds `tracking-[0.18em]` uppercase). The 1.6
  line height is deliberate: stacked Khmer consonants need it.
- **Figure** (Roboto, 500, `0.875rem`, tabular): Money, counts, dates in a
  column, ticket codes. `tabular-nums` appears on compact cells, summary
  tiles and progress figures; money is otherwise plain `$` text with
  `toLocaleString`, and a shared money formatter is the missing piece.

### Named Rules

**The Locked Pairing Rule.** Roboto and Nokora are a binding pair. Roboto is
flagged by the design detector as an overused face and that flag is knowingly
suppressed in `.impeccable/config.json`: the Khmer metric match outranks Latin
distinctiveness in a product whose fallback language is Khmer. A proposal to
change the Latin face must prove compatibility with Nokora in a compact table
row and on the printed slip.

**The Khmer-In-Every-Stack Rule.** Every stack carries a Khmer face — the
global rule guarantees it on screen. The print window's `Khmer OS Content`
should become Nokora so paper and screen shape Khmer the same way.

**The Caption Floor Rule.** `text-caption` (12px at 1.6) is the small step.
Arbitrary `text-[12px]`, `text-[10px]` and `text-[9px]` sizes are drift
except on the printed slips, which are paper, not chrome, and are recorded in
`.impeccable/config.json`.

**The Black Price Rule.** Black weight is for the price on a ticket tile.
Six uses today, all of them that; a seventh anywhere else is a defect.

## Layout

A shadcn sidebar (`16rem`, collapsing to a `3rem` icon rail, toggled with the
`b` key and remembered in a cookie) beside a content inset on the Floor, under
a sticky Paper header with a breadcrumb, the language switcher and the user
menu. The content pane pads at `{spacing.md}` (12px) — not 24px — because the
reference screen is a 1366×768 laptop. Below `md` the sidebar becomes a sheet
and tables become stacked cards.

**The back-office page pattern:** a Card with a title and a DataTable that
carries its own toolbar — search, filters, export to Excel, print — with the
page's primary action in the toolbar, not the header.

**The sale pattern:** the ticket page is a grid of `128px` tiles, one per
price card, tinted by facility, the price in Display; tapping one sells and
prints. Admins see a second tab for price configuration.

Spacing runs on a 4px base. Cards pad at `{spacing.xl}` (24px); controls are
`32px` tall (`h-8`), small `28px`, large `36px`, icon `32px` square — the
compact scale, chosen explicitly for the laptop.

Breakpoint usage is `sm` and `md` heavy (141 and 106 uses) with a handful of
`lg` and `xl`: mobile-aware, laptop-first.

### Named Rules

**The Laptop Rule.** Design at 1366×768. Thirty-two-pixel controls,
twelve-pixel page padding, compact table density. A component that only
works at 1920 is wrong here.

**The One Card Rule.** Every list, CRUD and report route is one Card with
one title and one DataTable. Nested cards are how a dense page becomes an
unreadable page.

**The Two Densities Rule.** A table is either comfortable (uppercase tracked
caption headers, zebra rows, `py-1.5`) or compact (the Notion-style ledger:
`text-caption` headers in sentence case, `py-[3px]` rows at `17px` leading,
tabular figures, vertical hairlines, no zebra). The choice is made per table
in `tableDensity.ts`, never per cell.

**The Column Priority Rule.** Narrow screens drop columns by importance or
stack the row as a card; they never wrap figures.

## Elevation & Depth

**Surfaces are flat at rest.** Depth comes from the hairline Rule and from
Wash. The incumbent code violates this in the usual way — `shadow-sm` on
twenty-five resting cards and table shells, the Card primitive's default
`shadow` — and those are drift. Shadow belongs to surfaces that float:
dialogs, dropdowns, toasts, and the sticky header, which is allowed a
`shadow-md` at 5% black because it genuinely floats over scrolling content.

### Shadow Vocabulary

- **Header** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`
  — Tailwind `shadow-md shadow-black/5`): The sticky navbar only.
- **Overlay** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
  — Tailwind `shadow-lg`): Dialogs (over a `bg-black/80` scrim), dropdowns,
  the language menu.
- **Modal** (Tailwind `shadow-xl`): Larger dialogs and sheets — ten uses,
  interchangeable with Overlay; consolidate on Overlay.

### Named Rules

**The Flat-At-Rest Rule.** If it does not float, it has no shadow. Cards and
table shells get `border border-border`.

**The Scrim-Not-Shadow Rule.** Dialog separation is the `bg-black/80` scrim's
job; reach for it before a heavier shadow.

## Shapes

One radius family from `--radius: 0.5rem` and one border weight. Controls at
`{rounded.md}` (6px): buttons, inputs, tabs, navigation items. Tables, dialogs
and dropdowns at `{rounded.lg}` (8px). Cards, ticket tiles and the login's
logo plate at `{rounded.xl}` (12px). Chips and avatars fully round.

Borders are 1px in `{colors.rule}`, with the ticket tile's `2px` facility
border as the one sanctioned emphasis border — it is the tile's identity, not
decoration. The printed slip's `2px` black frame is paper and follows paper
rules. The thick borders the detector finds today are the loading page's
`border-t-8` spinner and the DataTable's `border-b-2` spinner, recorded as
exceptions in `.impeccable/config.json`.

### Named Rules

**The One Rule Weight Rule.** 1px, `{colors.rule}`, everywhere on screen
except the ticket tile's facility edge.

**The Radius Ladder Rule.** Controls 6px, tables and dialogs 8px, cards and
tiles 12px, chips full. A container never rounds tighter than the control
inside it.

**The Slip Rule.** The printed slip has square corners, a 2px black frame,
black text on white and 2px rules. It is paper: no radius, no grey, no tint
that a thermal printer would fade.

## Components

### Buttons

- **Character:** Plain, compact, confident. No gradient, no shadow, no
  transform.
- **Shape:** `{rounded.md}` (6px); `32px` default, `28px` small, `36px`
  large, `32px` square icon.
- **Primary:** Register Ink ground, Chalk text; hover to 90%.
- **Semantic:** `success`, `warning`, `info` and `destructive` map onto the
  four marks — approve, hold, inform, reject — so an action carries the
  colour of the state it produces.
- **Outline / Secondary / Ghost / Link:** As shadcn defines them; Outline is
  the default secondary action in a toolbar.
- **Focus:** `2px` ring in Deep Ink at `2px` offset via `focus-visible`.
- **Disabled:** 50% opacity, pointer events off.

### Ticket Tile

The sale's signature component.

- **Shape:** `{rounded.xl}` (12px), `2px` border in the facility colour,
  `12px` padding, `128px` tall, ground tinted with the facility's tint.
- **Content:** The facility chip and product name in Label, the price in
  Display (black weight), the entitlement (days or entries) in Caption.
- **Behaviour:** Tapping sells, prints and returns; there is no confirm step
  at the counter.

### Chips

- **Facility chips:** Full-round, `2px 10px`, Caption type, facility tint
  ground and facility ink text.
- **Status chips:** The same construction on the four marks' tints — green
  for active or approved, orange-amber for pending, blue for informational,
  red for rejected — and grey on Wash for inactive. Built with the `-100`
  ground and `-700`/`-800` text steps of the same hue; never grey text on a
  tint.

### Inputs / Fields

- **Style:** Paper ground, 1px Rule stroke, `{rounded.md}`, `4px 12px`
  padding, `32px` tall, Body type; placeholder in Annotation Grey.
- **Focus:** `2px` Deep Ink ring at `2px` offset; the border does not change.
- **Error:** Stop border and message.

### Cards / Containers

- **Corner Style:** `{rounded.xl}` (12px). **Background:** Paper.
  **Border:** 1px Rule. **Shadow:** none at rest (the primitive's default
  `shadow` is drift). **Padding:** `{spacing.xl}` (24px).
- **Summary tiles:** The six-tone stat tile — value in Figure at Title size,
  label in Caption — for the dashboard and report heads. Paper with a
  facility or mark chip, not a gradient banner.

### Tables (DataTable)

The workhorse. Everything in the back office is one.

- **Shell:** Paper, `{rounded.lg}` (8px), 1px Rule (the `shadow-sm` on it is
  drift).
- **Toolbar:** Search, custom filters, export (Excel via `xlsx-js-style`,
  PDF, print window) and the page's primary action.
- **Header:** Wash at 50% alpha; Annotation Grey in Caption — uppercase and
  tracked in comfortable density, sentence case in compact.
- **Rows:** Rule hairlines, Wash hover; zebra only in comfortable density;
  compact adds vertical hairlines at 60% and `tabular-nums`.
- **Mobile:** Rows become stacked cards below `md`.

### Navigation (Sidebar)

- shadcn's sidebar on the Margin trio: `16rem` expanded, `3rem` icon rail,
  `18rem` as a mobile sheet; group labels in uppercase Caption with
  `0.18em` tracking; items `{rounded.md}` with `8px 12px` padding; the
  active item on Margin Wash in Deep Ink, no accent bar; sign-out in rose at
  the foot. Navigation is filtered by role.

### Header (Navbar)

- Sticky Paper bar with the Header shadow, a breadcrumb in Body, the language
  switcher with SVG flags, a Rule separator and the avatar menu. The stock
  photo avatar is drift; the user's initials on Wash is the intent.

### Dialogs

- **Scrim:** `bg-black/80`. **Panel:** Paper, `{rounded.lg}` at `sm`,
  `max-w-lg`, `24px` padding, Overlay shadow, entering with a fade, 95% zoom
  and a slide from 48% over `200ms`.

### Sign-in

The one bespoke surface: a fixed, centred `360px` card on Paper, the logo on
its pale plate, labels at 11px uppercase with `0.12em` tracking, and the
Amber submit with a glow and a hover lift, entering on a staggered
`nan-slide-up`. It is the family's sign-in, shared in spirit with CKD POS,
and its treatments — the glow, the lift, the per-file hex colours, the
off-scale label — stay inside this surface and are not precedents for the
app.

### Printed Slip

- **Canvas:** `405px` wide in the browser, converted to an 80mm PDF by the
  desktop shell; or a server-side document rendered by the ESC/POS worker at
  576 dots with sizes 30/22/24px.
- **Frame:** `2px` black border, square corners.
- **Content:** The club's Khmer name centred in Title, the branch line, a
  `150px` QR code, the ticket code, the date line in red (the one colour on
  the slip, so a stale ticket is caught by eye), cashier, price, a `2px`
  rule, and the towel/key fill-in line.
- **Type:** Roboto and Nokora in the browser; Noto Sans Khmer shaped by
  HarfBuzz on the worker. Literal pixel sizes here are paper, exempt from The
  Caption Floor Rule.

### Motion

Motion confirms a state change and nothing else. `transition-colors` is the
default; `200ms` for dialogs and dropdowns, `300ms` for sheets.

- **Radix `animate-in` / `animate-out`** (fade, 95% zoom, slide from top
  48%; `200ms`): Dialogs, dropdowns, the mobile sidebar sheet.
- **`accordion-down` / `accordion-up`** (`0.2s ease-out`): Disclosure.
- **`animate-spin`** / **`animate-pulse`**: Loading only.
- **`nan-slide-up`** (`0.55s cubic-bezier(0.16, 1, 0.3, 1)`, staggered
  50ms): The sign-in surface only.

**The Confirming Motion Rule.** No entrance animation on a table row or a
tile, no attention-seeking loop, no bouncy easing. This is an eight-hour
tool.

**The Keyframe Home Rule.** Keyframes live in `tailwind.config.cjs` or
`index.css`. `animate-shimmer`, `animate-fade`, `animate-slide`,
`animate-step-in` and `animate-fadeIn` are used but defined nowhere — they
do nothing today. Define them in the config or remove the classes.

## Do's and Don'ts

### Do:

- **Do** colour a ticket tile, price row or chip by its facility — swim
  blue, gym green, steam orange, combo purple — from one shared definition.
- **Do** map a record's state onto Success, Warning, Info or Stop, and use
  the matching button variant for the action that produces it.
- **Do** keep controls at `32px` and page padding at `12px`; this is a laptop
  tool.
- **Do** pick a table's density once, in `tableDensity.ts`, and set every
  money and count column in Figure with `tabular-nums`, right-aligned.
- **Do** keep Annotation Grey at 38% lightness and `text-caption` at 1.6 line
  height; check a Khmer header cell before calling a table done.
- **Do** give resting cards and table shells `border border-border` and no
  shadow; reserve shadow for the sticky header, dialogs and dropdowns.
- **Do** keep the printed slip black on white with square corners and 2px
  rules.
- **Do** use the token classes (`bg-card`, `text-muted-foreground`,
  `border-border`) instead of `gray-*` and `black` on new work.
- **Do** reach for a shadcn primitive in `frontend/src/components/ui/`
  before writing one, and delete `_ui-backup-pre-nanhr/` rather than
  consulting it.

### Don't:

- **Don't** use a gradient on a data surface; the profile header and the
  customer-type banner are the drift the detector already names.
- **Don't** define a facility palette in a page; three copies exist and one
  reads a key that is not there.
- **Don't** use black weight anywhere but the price on a ticket tile.
- **Don't** use an arbitrary `text-[Npx]` size on screen; `text-caption` is
  the floor and the slip is the only exception.
- **Don't** add a fifth saturated hue outside the four facilities and four
  marks; purple belongs to combination packages, not to headings.
- **Don't** use amber inside the app; it is the sign-in mark.
- **Don't** put a thick or coloured border on a card; the ticket tile's
  facility edge is the one exception.
- **Don't** use an animation class that has no keyframe, or declare a
  keyframe inside a page.
- **Don't** design for dark mode until a toggle exists and the stray `.dark`
  rule is removed.
- **Don't** introduce a fifth icon library; four already coexist (Heroicons,
  Lucide, react-icons, Headless UI). Lucide is the shadcn default; converge
  on it.
- **Don't** let a table wrap or shrink its figures on narrow screens; drop
  columns by priority or stack the row.
