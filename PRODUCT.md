# Product

<!-- impeccable:product-schema 1 -->

<!--
Written 2026-09-04 from the code, the runbooks in docs/ and the git history,
using the CKD-POS / NAN-HR PRODUCT.md as the template. No product interview
was held. Facts marked "(inferred)" were read off the code and need an owner's
confirmation; everything else is directly observable.
-->

## Platform

web

A React single-page app served by its own API server. At the club it runs
inside a pywebview desktop shell (`desktop/`, "CKD-Ticket.exe", full screen by
default) that adds printing, the fingerprint sidecar and an updater; the shell
does not make its design language native.

## Users

**Primary: the counter staff at a gym and swimming pool club** — the `Sale`
role. They sit at a laptop at the front desk selling day tickets, creating
members and taking their photo, renewing memberships, selling coupon cards,
training and fruit packages, and printing a slip for each. A queue forms at
this desk at opening time and after work.

Secondary audiences, confirmed present:

- **The owner or manager** (`Admin`) — sets ticket and membership prices,
  approves hold (freeze) and transfer requests, reads the income, customer and
  customer-type reports, manages printers. Sees everything the counter sees.
- **The checker** (`Checker`) — a second pair of eyes on transfer requests
  before an admin processes them.
- **The gate kiosks** (`kiosk` accounts) — machine users. CKD-Check-In and
  CKD-Check-Out call a whitelisted set of operations to look up and consume
  tickets, coupons and memberships and to record key and towel handover.
- **The member** — appears on screen as a photo, a name and an entitlement,
  and holds the printed slip with the QR code the gate scans. Never uses the
  app.

## Product Purpose

The counter and back office of one club with three facilities — swimming
pool, gym and steam room. It sells the right to enter (a day ticket, a
membership for a period, a coupon card with a number of uses, training and
fruit packages), records the money, prints a slip with a QR code, and publishes
every entitlement to the gates so that a scan or a fingerprint at the door is
answered from the same record the counter wrote. Around that it runs the
club's paperwork: holds that freeze a membership, transfers that move one to
another person, price tables, and the end-of-day and end-of-month reports.

Success is a customer served and through the gate with a slip in seconds, a
member whose entitlement is exactly what they paid for, and an income report
the owner can reconcile against the drawer.

## Positioning

- **One record for the counter and the gates.** The kiosks hold no rules and
  no data of their own. A ticket sold here is valid at the door because this
  system says so, over a change feed the gates subscribe to; a key handed over
  at entry is signed back in at exit against the same check-in row.
- **Requests that cannot run twice.** Transfers and holds go through a
  request → check → approve → process flow, and every transfer carries a
  unique request id that the database refuses to execute a second time — a
  rule written after a production incident in which one request executed
  nine times (`docs/`, `Entities/TransferRequest`).
- **Khmer-first at the counter.** The interface language falls back to
  Khmer, the token layer's secondary text colour was darkened specifically for
  Khmer legibility, and every printed slip carries the club's Khmer name and
  a Khmer-shaped receipt from the print worker.

## Operating Context

- **A laptop at a desk.** The reference screen is 1366×768: controls are
  32px tall, the content pane pads at 12px, and tables have a compact
  "ledger" density. The desktop shell runs the same app full screen.
- **Three facilities, one colour each.** Swim, gym and steam are the axis of
  every price table, ticket tile and chip; combination packages are a fourth
  colour. Staff read a product by its colour before its name.
- **Money is cash at a register.** Prices are dollar amounts entered against
  a price table; a `PaymentMethod` enum exists on the purchase row but no
  flow sets it. There is no card terminal, no KHQR, no PayWay.
- **Every sale prints.** A 405-pixel slip rendered in the browser and turned
  into an 80mm PDF by the desktop shell (SumatraPDF spool), or — the newer
  path — a print job queued server-side and rendered by a Python ESC/POS
  worker that shapes Khmer with HarfBuzz at 576 dots across. Only the ticket
  sale and a self-test use the new path today.
- **Identity is a photo, a fingerprint and a QR.** Members are photographed
  at the counter by webcam, enrolled on a ZKTeco reader through the desktop
  sidecar, and identified at the gates by finger; tickets and coupons are QR
  codes on paper; an RFID uid exists on the member row.
- **The database is mid-migration.** A legacy schema (per-product payment
  tables, member status columns) and a unified model (Package, Purchase,
  Entitlement, CheckIn) are dual-written; `docs/db-redesign.md` and
  `db-redesign-migration.md` are the authority. Migrations are deliberately
  not run at boot.
- **Production is one Windows 10 box** on Tailscale with 4GB of memory:
  the API as an NSSM service on port 4000, XAMPP MySQL, Node 18, the SPA
  served by the API itself. The Docker files, nginx config and `deploy.sh`
  in the repo are a dead path. There is no staging environment. A Cloudflare
  tunnel exposes the app at a public hostname.
- **Two clients, one API.** The browser SPA and the desktop app (the pywebview
  host in `desktop/`, packaged as `CKD-Ticket.exe`) consume the same GraphQL
  schema, generated into typed hooks; the desktop app adds printing,
  fingerprint, camera and self-update through a small bridge that keeps the
  legacy `window.electronAPI` name so the call sites did not change. Electron
  itself is gone.

## Capabilities and Constraints

Confirmed functional areas (10 routes, 4 roles):

- Dashboard with today's figures and quick actions; report grid for admins
- Ticket sale by facility with automatic slip printing; ticket price
  configuration (admin)
- Members: list, profile, create with webcam or uploaded photo, renew,
  coupon, training and fruit payments, fingerprint enrolment (desktop only)
- Member price table
- Hold requests and transfer requests with checker and approver stages
  (v1 and v2 resolvers)
- Income report, customer scan report, customer-type and membership-duration
  report; Excel and PDF export and a print window
- Printer settings through the desktop bridge
- Sign-in with JWT and refresh; role-filtered navigation
- Gate operations for kiosk accounts: lookup and consume ticket, coupon and
  member; fingerprint template feed with a 90-day window; check-out item
  update; SSE change feed

Technical constraints future work must respect:

- **Stack is settled.** Express 4 + Apollo Server 3 + type-graphql 1.1 +
  TypeORM 0.3 on MySQL/MariaDB, `graphql-shield` for permissions; React 18 +
  Vite 4 + Apollo Client 3 + react-router 6 + Tailwind 3 + shadcn/ui
  (new-york, slate) with GraphQL codegen. The runtime data source is
  `MysqlDataSource`; type-graphql fields need explicit nullable types; codegen
  validates every `.graphql` document together.
- **Permissions are a whitelist.** `permissions.ts` allows staff everything
  and kiosks eleven named operations; two pages still carry `TODO: Check
  Permission`.
- **The database name is `sportclub`** and `synchronize` is on outside
  production — schema drift between dev and prod is a real risk.
- **Terminology.** A *ticket* is a day pass; a *membership* is a period; a
  *coupon card* is a count of entries; an *entitlement* is any of those as
  the gate sees it; a *hold* freezes a membership; a *transfer* moves one to
  another member; a *purchase* is the money row; a *facility* is swim, gym
  or steam.
- **Navigation has dead links.** Coupon price table, users and user
  authorisation are in the sidebar with no route; "Your Profile" and
  "Settings" in the user menu go nowhere.

Explicitly undecided / not yet true:

- No refund flow of any kind.
- Server-side print documents exist only for ticket sale and self-test;
  member, coupon, training, fruit, hold and transfer slips still print through
  the browser.
- `node-telegram-bot-api` is installed and never imported; there are no
  notifications.
- `@tanstack/react-router` and `react-webcam` are installed and unused
  (inferred leftovers).
- The user-menu avatar is a hard-coded stock photo of "Tom Cook".
- Dark theme tokens exist with 34 `dark:` utilities but nothing enables them.

## Brand Commitments

- **Standing visual preference (2026-09-05): the conventional admin, played
  straight, with Square Dashboard as the craft bar.** Offered a hand of visual
  worlds twice — the second time after the Gym Whiteboard had been built and
  seen — the owner chose the category standard. Future visual work executes
  that convention at full fidelity rather than proposing a new world, and
  matches CKD-POS, which made the same choice against Square POS. The two
  systems are meant to read as one company's software.
- **Names:** the repository and desktop app are "CKD-Ticket"; the PWA
  manifest is "MH-System"; every printed slip carries the club's own name,
  "មិង ហួរ ក្លឹបហាត់ប្រាណ & អាងហែលទឹក (សាខាចំការដូង)", and "សូមអរគុណ!"
  from `backend/src/Print/shopProfile.ts`. The identity on paper is the
  club's.
- **The login mark** is `frontend/public/nan-tech-logo.png` on a pale plate
  with the amber accent shared with CKD-POS — the family mark of these
  systems, not the club's.
- **Roboto and Nokora are bundled** through `@fontsource` so the app needs
  no network for type; Nokora is the Khmer face on screen, Noto Sans Khmer
  on the print worker. Any typographic direction must keep a working Khmer
  face on screen and on thermal paper.
- **The token layer is shared inheritance with NAN-HR**: the shadcn slate
  custom properties plus `--success`, `--warning`, `--info` and the sidebar
  tokens, with `--muted-foreground` darkened to 38% lightness for Khmer and a
  `caption` type step with 1.6 line height for stacked Khmer consonants.
  Those two adjustments are commitments, not defaults.

## Evidence on Hand

- `docs/` — five runbooks including the deployment guide for the kiosk
  gateway box and the two database redesign documents.
- `frontend/src/i18n/locales/{en,km}.json` — 286 / 284 keys covering the
  shell; page bodies are hard-coded Khmer.
- `frontend/src/components/ComponentToPrint/` — the five printed slips as
  actually rendered; `backend/src/Print/documents/` — the server-side
  ticket document; `print-worker/` — the ESC/POS renderer with its Khmer
  font.
- `frontend/src/components/ui/tableDensity.ts` — the two table densities,
  written down.
- `backups/` — database backups; a copy of production data is available for
  evaluating screens at real volumes (inferred from the directory).
- The live production deployment and the two gate kiosks that consume this
  API.

**Not on hand — future work must not fabricate these:** member counts,
revenue, testimonials, named partners, pricing or licensing of the software,
uptime claims, security certifications.

## Product Principles

1. **The counter is fast on a laptop.** Selling a ticket is a tap on a
   coloured tile and a slip in the hand; everything about density, control
   size and layout serves a 1366×768 screen with a queue in front of it.
2. **Every entitlement traces to a purchase.** A gate answer, a report line
   and a slip all derive from the same purchase and entitlement rows; prefer
   showing the derivation over a cleaner total.
3. **Never execute a request twice.** Holds and transfers are requests with
   stages and a unique id, because the alternative already happened.
4. **Khmer is the first language.** Fallback language, contrast, line height
   and printed shaping are tuned for Khmer; English is the second script,
   not the design centre.
5. **One record for the counter and the gates.** A capability lands in this
   API and the kiosks consume it; a kiosk never keeps its own truth.

## Accessibility & Inclusion

- **Khmer legibility is a hard requirement**: secondary text at 6.58:1 on
  white, caption line height at 1.6 for stacked consonants, and Khmer glyphs
  must not clip in chips, table cells or on the slip.
- **Laptop density, long sessions**: 32px controls and compact tables are
  the working scale; sustained-reading contrast outranks whitespace.
- **The sidebar collapses to an icon rail** and can be toggled with the `b`
  key; mobile renders tables as cards.
- **Printed slips must survive a thermal printer**: 2px rules, black on
  white, no greys that fade.
