/**
 * Change feed for the gate kiosks (Server-Sent Events).
 *
 * The kiosks keep one thing cached: the fingerprint templates loaded into the
 * reader's 1:N database. Everything else they ask the API for on every scan.
 * Until now that cache was refreshed by polling the whole set every five
 * minutes, so a member enrolled or renewed at the till could be "unknown" at
 * the gate for that long. Now the mutations that change a fingerprint or a
 * membership call emitChange(), and every kiosk holding GET /events/checkin
 * open receives the customer id within a few milliseconds and refreshes just
 * that one entry.
 *
 * Plain SSE over the existing port: no extra dependency on either side, and
 * the kiosk client is a streaming HTTP GET.
 *
 * Wire format (one event per change):
 *     id: <epoch>-<seq>
 *     event: change
 *     data: {"type":"fingerprint","customer_id":814,"at":"..."}
 *
 * `epoch` is random per server start. A reconnecting client sends its last id
 * back as Last-Event-ID; if the epoch matches and the id is still in the ring
 * buffer, the missed events are replayed, otherwise the server answers with
 * `event: resync` and the client reloads the full set once. A comment line is
 * sent every 25 s so a dead connection is noticed within a minute.
 */
import { EventEmitter } from "events";
import type { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { randomBytes } from "crypto";

export type ChangeType = "fingerprint" | "member" | "customer";

export interface ChangeEvent {
  seq: number;
  type: ChangeType;
  customer_id: number;
  at: string;
}

const EPOCH = randomBytes(4).toString("hex");
const RING_SIZE = 1000;
const PING_MS = 25_000;

const emitter = new EventEmitter();
emitter.setMaxListeners(500);
const recent: ChangeEvent[] = [];
let seq = 0;

/** Announce that a customer's fingerprint or membership changed. Never throws. */
export function emitChange(type: ChangeType, customerId: number | string | null | undefined): void {
  const id = Number(customerId);
  if (!Number.isFinite(id) || id <= 0) return;
  seq += 1;
  const ev: ChangeEvent = { seq, type, customer_id: id, at: new Date().toISOString() };
  recent.push(ev);
  if (recent.length > RING_SIZE) recent.shift();
  try {
    emitter.emit("change", ev);
  } catch (err) {
    console.error("[changeFeed] listener failed:", err);
  }
}

export function feedStats(): { epoch: string; seq: number; listeners: number } {
  return { epoch: EPOCH, seq, listeners: emitter.listenerCount("change") };
}

function tokenFrom(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const q = req.query.token;
  return typeof q === "string" && q ? q : null;
}

function frame(ev: ChangeEvent): string {
  return `id: ${EPOCH}-${ev.seq}\nevent: change\ndata: ${JSON.stringify(ev)}\n\n`;
}

/** GET /events/checkin — any valid access token (kiosk or staff). */
export function checkinEventsHandler(req: Request, res: Response): void {
  const token = tokenFrom(req);
  if (!token) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  try {
    verify(token, process.env.ACCESS_TOKEN_SECRET as string);
  } catch {
    res.status(401).json({ error: "invalid token" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 3000\n\n");

  // Catch-up: replay what a reconnecting client missed, or tell it to resync.
  const lastRaw = String(req.headers["last-event-id"] || req.query.last_id || "");
  if (lastRaw) {
    const [epoch, n] = lastRaw.split("-");
    const lastSeq = Number(n);
    const oldest = recent.length ? recent[0].seq : seq + 1;
    const replayable = epoch === EPOCH && Number.isFinite(lastSeq) && lastSeq <= seq && lastSeq >= oldest - 1;
    if (replayable) {
      for (const ev of recent) if (ev.seq > lastSeq) res.write(frame(ev));
      res.write(`event: caught-up\ndata: ${JSON.stringify({ epoch: EPOCH, seq })}\n\n`);
    } else {
      res.write(`event: resync\ndata: ${JSON.stringify({ epoch: EPOCH, seq, reason: "unknown last id" })}\n\n`);
    }
  } else {
    res.write(`event: hello\ndata: ${JSON.stringify({ epoch: EPOCH, seq })}\n\n`);
  }

  const send = (ev: ChangeEvent) => {
    res.write(frame(ev));
  };
  emitter.on("change", send);
  const ping = setInterval(() => res.write(`: ping ${Date.now()}\n\n`), PING_MS);

  const cleanup = () => {
    clearInterval(ping);
    emitter.off("change", send);
  };
  req.on("close", cleanup);
  res.on("error", cleanup);
}
