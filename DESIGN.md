---
name: CKD Ticket
description: The counter runs on the club's whiteboard — prices written up in marker, today's sales written down as they happen, and a magnet for the state of every record.
colors:
  board: "#FFFFFF"
  board-grid: "#EEF1F4"
  tray: "#F4F6F8"
  rule: "#D9DEE3"
  ink: "#1F2328"
  ink-soft: "hsl(215 16% 38%)"
  swim: "#1F5AE0"
  gym: "#12A150"
  steam: "#F0620E"
  combo: "#7A3FE4"
  magnet-done: "#16A34A"
  magnet-pending: "#F5C518"
  magnet-rejected: "#DC2626"
  magnet-info: "#2563EB"
  magnet-off: "#9CA3AF"
  amber: "#D97B2A"
  amber-deep: "#C46D22"
typography:
  heading:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.2
  title:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
    lineHeight: 1.4
  price:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1.1
    fontFeature: "'tnum' 1"
  body:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
  caption:
    fontFamily: "Roboto, Nokora, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0.02em"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
components:
  button-default:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "36px"
  button-commit:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "36px"
  button-commit-outline:
    backgroundColor: "rgb(217 123 42 / 0.1)"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.board}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.tray}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "36px"
  price-tile:
    backgroundColor: "{colors.board}"
    textColor: "{colors.ink}"
    typography: "{typography.price}"
    rounded: "{rounded.xl}"
    padding: "0.75rem"
    height: "112px"
    width: "160px"
  magnet-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
  input-default:
    backgroundColor: "{colors.board}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "32px"
    width: "100%"
  table-header-cell:
    backgroundColor: "{colors.tray}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
    padding: "0.375rem 0.75rem"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  nav-item-active:
    backgroundColor: "{colors.board}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  print-slip:
    backgroundColor: "#FFFFFF"
    textColor: "#000000"
    typography: "{typography.body}"
    rounded: "0"
    padding: "1rem"
    width: "405px"
---

# Design System: CKD Ticket

## Overview

**Creative North Star: "The Gym Whiteboard"**

The counter runs on the board behind the desk. Prices are written up in marker,
grouped in columns by facility; today's sales are written down underneath as they
happen; and every record that is waiting on someone carries a magnet. The interface
is that board made electronic — a white field with a faint printed grid, marker-hued
headings, thick marker rules between sections, and one amber marker reserved for the
action that takes money.

The colour system is the board's own logic. Four marker hues name the four things
the club sells access to — blue for swimming, green for the gym, orange for the
steam room, purple for a combination — and they appear as a stripe across the top of
a price tile, as a dot beside a name, and nowhere else. Five magnets name the state
of a record: done, pending, rejected, informational, and off. Those two systems, plus
amber for a commitment, are the entire saturated palette; everything else is ink on
board with one hairline.

The scale is a counter's, not a showroom's. The reference screen is a 1366×768
laptop with a queue at the desk, so controls are 36px, the content pane pads at
12px, and tables run at a compact ledger density tuned line by line for Khmer.
Secondary text is deliberately darker than a stock theme would set it, and the
caption step carries extra line height, because Khmer stacks subscript consonants
that crowd the line beneath. Both faces are bundled with the app; the counter never
waits on a network to render a price.

**Key Characteristics:**

- A white board with a printed 24px grid, ruled off in 2px marker between sections.
- Four marker hues for facilities, five magnets for record state, one amber for the commitment.
- Marker weight is real weight: headings and prices are set at 900.
- Compact by design — 36px controls, 12px page padding, a ledger table density.
- Khmer-tuned contrast and line height, on screen and on the printed slip.
- Light-only, laptop-first, with the printed slip as its own paper world.

## Colors

A white board carrying two colour systems that never overlap: marker hues say what a
product is, magnets say what state a record is in.

### Primary

- **Ink** (`#1F2328`): dry-erase black, not pure black. Every heading, label, table cell and primary button. It is the darkest thing on the board.
- **Soft Ink** (`hsl(215 16% 38%)`): the metadata voice — column headers, helper text, timestamps, the second line of a cell. Deliberately darker than the stock theme's secondary text so Khmer at caption size stays legible; this value is a commitment, not a default.

### Secondary

- **Board** (`#FFFFFF`): the writing surface. Cards, tables, the navbar, the content field.
- **Board Grid** (`#EEF1F4`): a printed 24px grid, drawn with two repeating gradients on board surfaces that want to read as the board itself rather than as a panel — the request columns, the sign-in field.
- **Tray** (`#F4F6F8`): the marker tray. The sidebar's ground, table header bands, secondary buttons, the user chip.
- **Rule** (`#D9DEE3`): the single hairline, for borders and row dividers. Section breaks use a 2px ink rule instead — that one is a marker stroke, not a hairline.

### Tertiary

The four marker hues. Each names a facility and appears only as a tile stripe, a
magnet-style dot, or a large price figure.

- **Swim Blue** (`#1F5AE0`)
- **Gym Green** (`#12A150`)
- **Steam Orange** (`#F0620E`)
- **Combo Purple** (`#7A3FE4`): a product that grants more than one facility. A combination tile stripes all of its facilities side by side and overlaps their dots, so the mixture is visible rather than named.

Gym green and steam orange measure roughly 3.3:1 on white, so they are never used
for text. They colour dots, stripes and the 1.875rem price figure only; a product's
name is always ink.

### Semantic marks

The magnets. Each is a small disc with a printed highlight and a real drop shadow —
the one object in the system that is allowed to look physical, because a magnet is.

- **Done** (`#16A34A`): paid, approved, processed, active.
- **Pending** (`#F5C518`): awaiting a checker or an approver; a membership about to lapse.
- **Rejected** (`#DC2626`): rejected, cancelled, expired, and the destructive action that produces it.
- **Info** (`#2563EB`): informational or system-generated.
- **Off** (`#9CA3AF`): inactive, or a state that has not been reached yet.

### The commitment

- **Amber** (`#D97B2A`) and **Amber Deep** (`#C46D22`): the action that takes money or settles a request — sell, print, process, sign in. Amber carries **ink lettering, not white**: white on amber measures 3.1:1 and fails, ink measures 5.1:1 and passes. Hover draws a 3px inset underline in the deep amber, like a second stroke of the same marker; active fills with it.

### Named Rules

**The Facility Rule.** Blue, green, orange and purple mean swimming, gym, steam and
combination — on a tile, a price row, a chip, a report column. They are never chosen
per page for variety, and they are defined exactly once, in `frontend/src/lib/facility.ts`.
A page that declares its own facility palette is a defect; there were three such
copies before this system existed.

**The Two Systems Rule.** A marker hue says what something *is*; a magnet says what
state it is *in*. They never swap jobs. A record's status is never coloured with a
facility hue, and a facility is never represented by a magnet colour.

**The Ink Text Rule.** Gym green and steam orange do not clear 4.5:1 on white, so no
sentence, label or table cell is ever set in a marker hue. Marker colour lives in
dots, stripes and the large price figure; the words stay ink.

**The One Amber Rule.** Amber marks the committing action and nothing else — never a
heading, a border for emphasis, a chip, or an answer to "this looks plain". It is
also the only place in the product where a colour carries ink lettering rather than
white, and that is deliberate: the contrast floor decides the lettering, not the
convention.

**The Legible Khmer Rule.** Soft ink stays at 38% lightness. Lightening it back
toward a stock theme's default for Latin taste breaks Khmer at caption size.

## Typography

**Body Font:** Roboto, weights 300–900, bundled through `@fontsource`.
**Khmer Font:** Nokora, weights 100–900, bundled through `@fontsource`.

**Character:** One stack does everything: `Roboto, Nokora, sans-serif`, set globally.
Roboto covers Latin, Nokora covers Khmer, and the two never compete for a glyph.
Both are bundled with the application rather than fetched, so a counter with no
internet renders exactly like one with it — the faces used to load from a font CDN
and no longer do. There is no display serif in this system. The loudest thing on the
board is a price set in Roboto Black.

### Hierarchy

- **Heading** (900, 1.5rem, line-height 1.2): a board section's title. Marker weight is what makes it read as written up rather than typeset.
- **Title** (900, 1.125rem, line-height 1.4): card and dialog headings, the club's name at the head of a printed slip.
- **Price** (900, 1.875rem, line-height 1.1, tabular): the figure on a price tile, in its facility's marker hue. The one place the black weight is allowed outside a heading.
- **Body** (400, 0.875rem, line-height 1.5, tabular): table cells, form values, descriptions — the register voice.
- **Label** (500, 0.875rem, line-height 1.25): buttons, inputs, navigation items, tabs.
- **Caption** (500, 0.75rem, line-height 1.6, letter-spacing 0.02em): the `text-caption` step — compact column headers, chip labels, eyebrows, the sidebar's group labels at 0.18em tracking. The 1.6 line height is deliberate and load-bearing: Khmer stacks coeng and below-vowels that crowd the next line at 1.4.

### Named Rules

**The Caption Floor Rule.** `text-caption` at 0.75rem is the smallest type on screen.
Arbitrary `text-[Npx]` sizes are drift; the printed slips are the sole exception,
because they are paper calibrated to a thermal raster rather than to this ramp.

**The Marker Weight Rule.** Weight 900 belongs to headings and to the price on a
tile. It is the system's way of writing in marker, and spending it anywhere else
makes the board shout.

**The Tabular Figures Rule.** Money, counts, dates in a column and ticket codes are
set with tabular numerals, and money is formatted through one helper
(`frontend/src/lib/money.ts`) rather than per page.

**The Bundled Face Rule.** Both faces ship with the application. A new face must be
added to `@fontsource` and bundled, never referenced from a CDN, and must prove it
sits with Nokora in a compact table row and on the printed slip.

## Layout

A sidebar on the marker tray beside a content field on the board, under a sticky
white navbar closed with a 2px ink rule rather than a shadow. The content pane pads
at 12px because the reference screen is a 1366×768 laptop; the sidebar collapses to
an icon rail, is toggled with Ctrl/Cmd+B, remembers its state in a cookie, and
becomes a sheet below `md`.

**The board pattern.** Every surface opens with a board header: the club's name and
today's date on one baseline, the page title beneath it, and a 2px ink rule closing
the block. Sections below it are separated by the same rule, never by cards inside
cards.

**The sale pattern.** The ticket page is four facility columns of price tiles, each
column capped so that today's board — the register of sales and its reprint control
— begins above the fold at 1366×768. The columns scroll internally rather than
pushing the register off the screen: on this surface the register is the promise, and
a price the counter has to scroll for costs less than a register nobody can see.

Spacing runs on a 4px base. Controls are 36px tall (32px small, 44px large), inputs
32px, cards pad at 1.5rem, and tables offer two densities chosen once in
`components/ui/tableDensity.ts`: comfortable, with tracked uppercase headers and
zebra rows, or the compact ledger, with sentence-case caption headers, 3px row
padding at 17px leading, vertical hairlines and tabular figures.

### Named Rules

**The Laptop Rule.** Design at 1366×768. A component that only works at 1920 is
wrong here.

**The Board Header Rule.** Every surface opens with the same header block and closes
it with a 2px ink rule. It is a masthead, not an eyebrow: the club name and the date
share a baseline, and the page title sits on the row below.

**The Register Above The Fold Rule.** On the sale surface, today's board must begin
within the first viewport at the reference size. Tile columns give up height for it.

**The Two Densities Rule.** A table is comfortable or compact, chosen once in the
density module, never adjusted per cell.

## Elevation & Depth

**The board is flat.** Depth comes from the hairline, the 2px marker rule, and the
tray. Cards and table shells sit on the board with a 1px rule and no shadow.

Two things are allowed to lift, and both are objects rather than surfaces: the
**magnet**, which carries a real drop shadow and an inner lip because a magnet
physically sits on a board, and the **sticky navbar**, which genuinely floats over
scrolling content. Dialogs, dropdowns and the mobile sidebar sheet take an overlay
shadow over a scrim.

### Shadow Vocabulary

- **Magnet** (`box-shadow: 0 2px 4px rgb(0 0 0 / 0.25), inset 0 -1px 0 rgb(0 0 0 / 0.18)`): the state disc, at 22px, 14px and 10px. The inset lip is the underside of the magnet.
- **Header** (`shadow-md` at 5% black): the sticky navbar only.
- **Overlay** (`shadow-lg`): dialogs over a scrim, dropdowns, the language menu.

### Named Rules

**The Flat Board Rule.** If it is a surface, it has no shadow — cards and tables take
`border border-rule`. If it is an object on the board, it may. The magnet is the only
object.

## Shapes

One radius family from `--radius: 0.5rem`. Controls, inputs and navigation items sit
at 0.375rem; tables, dialogs and dropdowns at 0.5rem; price tiles and cards at
0.75rem; magnets, chips and avatars are fully round.

Borders are 1px in the rule colour, with two deliberate exceptions that are both
marker strokes rather than decoration: the **2px ink rule** that closes a board
header and separates sections, and the **3px facility stripe** across the top of a
price tile, which is the tile's identity. A combination tile splits that stripe
between its facilities.

The printed slip has square corners, a 2px black frame and 2px rules. It is paper and
follows paper rules.

### Named Rules

**The Marker Stroke Rule.** A thick line is a marker stroke and means a section
boundary or a product's identity. Nothing else gets one; there is no accent border
on a card.

**The Radius Ladder Rule.** Controls 6px, tables and dialogs 8px, tiles and cards
12px, magnets and chips full. A container never rounds tighter than the control
inside it.

## Components

### Price Tile (signature component)

The sale unit, and the thing a counter taps hundreds of times a day.

- **Shape:** 160×112 minimum on the board, 0.75rem radius, 1px rule, a 3px facility stripe across the top, growing taller when a name needs two lines rather than clipping it.
- **Content:** the facility dots at the top right, the product name in label weight clamped to two lines, and the price at the bottom in 1.875rem black in the facility's hue. A caption names what the price grants.
- **Behaviour:** tapping sells and prints in one action — there is no confirmation step at the counter. The tile presses to 0.98 and today's board gains a line.
- **Combination:** the stripe divides between the facilities and the dots overlap with `mix-blend-mode: multiply`, so two markers reading as one mixed stroke.

### Magnet and Magnet Chip

- **Magnet:** a disc at 22px, 14px or 10px, drawn with a white highlight at 35%/30%, its state colour beneath, a drop shadow and an inner lip.
- **Chip:** a magnet beside a label in caption type and ink. This replaces the tinted status pill entirely; a record's state is a magnet on the board, not a coloured word.

### Today's Board

The register beneath the tiles on the sale surface: time, customer, facility dot,
amount and a printed magnet, in the compact ledger density. New lines arrive at the
top over 200ms — the one authored motion in the system — and the newest line offers
an amber reprint.

Its heading names its own scope, because the tally beside it and the lines beneath it
do not share one: the tally is the server's figure for every counter today, the
register is this counter's own session.

### Request Columns

Holds and transfers as magnet cards moving across three columns — requested, checked,
processed — on a board-grid field. A state change slides the card to the next column.

### Buttons

- **Shape:** 0.375rem radius; 36px default, 32px small, 44px large, 36px square icon. `transition-colors` only.
- **Default:** ink ground, white label.
- **Commit:** amber ground with an **ink** label, hover drawing a 3px inset underline in amber deep, active filling with it. One per surface.
- **Commit outline:** the same commitment at lower volume — an amber-deep border on a 10% amber wash — for a secondary reprint or a repeat action.
- **Semantic:** destructive, warning, info and success take the four magnet colours, so an action wears the colour of the state it produces.
- **Outline / Secondary / Ghost:** board with a rule, tray, and bare ink.
- **Focus:** a 2px ink ring at 2px offset via `focus-visible`.

### Tables (DataTable)

The back office's workhorse. Board shell at 0.5rem with a 1px rule and no shadow; a
tray header band with caption-type soft-ink headers; rule hairlines between rows and
a tray hover. The compact density adds vertical hairlines at 60% and tabular figures.
Status columns carry magnet chips; facility columns carry a dot and a name. Rows
become stacked cards below `md`. The toolbar owns search, filters, Excel and PDF
export, and the page's primary action.

### Sidebar and Navbar

- **Sidebar:** the board's index on the tray — 16rem expanded, 3rem as an icon rail, 18rem as a mobile sheet. Group labels are caption caps at 0.18em. An item carries a magnet-style dot that turns ink when active, and the active item sits on a white chip. No left accent bar. Sign-out is in the rejected magnet's colour.
- **Navbar:** white, sticky, closed with a 2px ink rule, carrying the breadcrumb, the language switcher and a user chip with the member's initials on tray.

### Dialogs

Radix dialogs on a scrim: a board panel at 0.75rem with a 2px ink rule under the
title, entering with a fade, a 95% zoom and a slide over 200ms.

### Printed Slip

The one component that is not a screen, and the only thing here that is not the
board.

- **Canvas:** 405px wide in the browser, converted by the desktop shell to an 80mm PDF; the server-side path renders the same document on an ESC/POS worker at 576 dots with Khmer shaped by HarfBuzz.
- **Frame:** a 2px black border, square corners, black on white, 2px rules.
- **Content:** the club's Khmer name centred, the branch line, a 150px QR code, the ticket code, the date in red — the only colour on the slip, so a stale ticket is caught by eye — the cashier, the price, and the towel and key line.
- **Rule:** the slip is paper. It does not take board tokens, marker hues, magnets or the type ramp; it takes ink, paper and the two bundled faces.

### Motion

Motion confirms a state change and nothing else. `transition-colors` is the default;
200ms for dialogs, dropdowns and a new register line; 300ms for the mobile sheet.

- **Radix `animate-in` / `animate-out`** (fade, 95% zoom, slide from top): dialogs, dropdowns, the sidebar sheet.
- **`accordion-down` / `accordion-up`** (0.2s ease-out): disclosure.
- **Register line-in** (200ms): a sale writing itself onto today's board — the system's one authored moment.
- **`animate-spin`** and the shimmer skeleton: loading only.

**The Confirming Motion Rule.** No entrance animation on a table row or a price tile,
no attention-seeking loop, no bouncy easing. This is an eight-hour tool with a queue
in front of it.

**The Declared Keyframe Rule.** An animation class must have a keyframe behind it.
Several classes in this codebase once animated nothing at all; a class without a
declared keyframe is a defect, and keyframes live in `tailwind.config.cjs` or
`index.css`, never inside a page.

## Do's and Don'ts

### Do:

- **Do** take facility colour from `lib/facility.ts` and nowhere else, and let a combination tile show its stripes side by side.
- **Do** say what state a record is in with a magnet, and what a product is with a marker hue.
- **Do** keep controls at 36px and page padding at 12px; this is a laptop tool.
- **Do** put ink lettering on amber, and reserve amber for the one committing action on a surface.
- **Do** set a product name, a label and a table cell in ink, whatever colour its facility is.
- **Do** open every surface with the board header and close the block with a 2px ink rule.
- **Do** keep today's board inside the first viewport on the sale surface, even at the cost of visible tiles.
- **Do** name a panel's scope when the figures beside it and the rows beneath it come from different queries.
- **Do** set money through the shared formatter and every compared figure in tabular numerals.
- **Do** keep soft ink at 38% and the caption step at 1.6 line height, and check a Khmer header before calling a table done.
- **Do** keep the printed slip black on white with square corners and 2px rules.

### Don't:

- **Don't** declare a facility palette inside a page.
- **Don't** set text in gym green or steam orange; they do not clear 4.5:1 on white.
- **Don't** put white lettering on amber.
- **Don't** use amber for a heading, a chip, a border or a background.
- **Don't** use the black weight anywhere but a heading and a tile price.
- **Don't** add a shadow to a card or a table shell. The magnet and the sticky navbar are the only things that lift.
- **Don't** put a thick or coloured border on a card; the 2px section rule and the 3px tile stripe are the only heavy lines.
- **Don't** use an arbitrary `text-[Npx]` size on screen; the printed slip is the only exception.
- **Don't** ship an animation class with no keyframe behind it, or declare a keyframe inside a page.
- **Don't** let a table wrap or shrink its figures on narrow screens; drop columns by priority or stack the row.
- **Don't** design for dark mode. The board is light-only and the stray `.dark` rule that once contradicted the tokens has been removed.
- **Don't** add a fifth icon library. Lucide is the direction of travel; a file being touched moves toward it.
