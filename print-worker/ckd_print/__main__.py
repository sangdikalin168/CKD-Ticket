"""Worker entry point — newline-delimited JSON over stdin/stdout.

Same protocol shape as desktop/ckd_desktop/fp_enroll.py, which this codebase
already runs in production: one JSON object per line in, one per line out, and
DIAGNOSTICS GO TO STDERR ONLY. stdout carries protocol traffic exclusively.

  in : {"cmd":"print","job_id":42,"schema":1,"copies":1,"doc":{...}}
       {"cmd":"status"}
       {"cmd":"ping"} / {"cmd":"quit"}
  out: {"type":"ready","schema":1,"printer":"RP80"}
       {"type":"result","job_id":42,"ok":true,"spooler_job_id":7,"bytes":12345}
       {"type":"result","job_id":42,"ok":false,"error":"...","retryable":true}

CKD_PRINT_DUMP=<dir> writes the ESC/POS bytes and a PNG preview to that
directory INSTEAD of spooling, so the whole pipeline can be checked with no
printer and no server attached.
"""
from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

from . import compose, escpos

# Python on Windows defaults stdin/stdout to the ANSI codepage (cp1252 here),
# which cannot represent Khmer: the first receipt would die with
# UnicodeEncodeError/UnicodeDecodeError before anything reached the printer.
# The protocol is UTF-8 by definition, so pin both ends of it.
for _stream in (sys.stdin, sys.stdout):
    try:
        _stream.reconfigure(encoding="utf-8", errors="strict")
    except Exception:  # pragma: no cover - not all wrappers support it
        pass

logging.basicConfig(
    level=os.environ.get("CKD_PRINT_LOGLEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stderr,   # never stdout: that is the protocol channel
)
log = logging.getLogger("ckd_print")

PRINTER = os.environ.get("CKD_PRINTER", "RP80")
DUMP_DIR = os.environ.get("CKD_PRINT_DUMP")


def _emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def _dump(job_id, payload: bytes, doc: dict) -> dict:
    out = Path(DUMP_DIR)
    out.mkdir(parents=True, exist_ok=True)
    (out / f"job-{job_id}.bin").write_bytes(payload)
    compose.build_bitmap(doc).save(out / f"job-{job_id}.png")
    log.info("dumped %d bytes + preview to %s", len(payload), out)
    return {"type": "result", "job_id": job_id, "ok": True,
            "dumped": str(out), "bytes": len(payload)}


def _handle(msg: dict) -> dict | None:
    cmd = msg.get("cmd")

    if cmd == "ping":
        return {"type": "pong"}

    if cmd == "status":
        if DUMP_DIR:
            return {"type": "status", "printer": PRINTER, "dump_mode": True}
        from . import spool
        try:
            return {"type": "status", **spool.printer_status(PRINTER)}
        except Exception as exc:
            return {"type": "status", "printer": PRINTER, "error": str(exc)}

    if cmd == "print":
        job_id = msg.get("job_id")
        schema = msg.get("schema")
        if schema != compose.SCHEMA_VERSION:
            # A stale worker binary must fail loudly rather than print garbage.
            return {"type": "result", "job_id": job_id, "ok": False,
                    "retryable": False,
                    "error": f"schema {schema} != worker {compose.SCHEMA_VERSION}"}

        doc = msg.get("doc") or {}
        copies = max(1, int(msg.get("copies", 1)))
        try:
            payload = compose.build_payload(doc)
        except Exception as exc:
            log.exception("compose failed")
            # Bad content will never succeed; retrying wastes the queue's budget.
            return {"type": "result", "job_id": job_id, "ok": False,
                    "retryable": False, "error": f"compose: {exc}"}

        if DUMP_DIR:
            return _dump(job_id, payload, doc)

        from . import spool
        spooler_ids = []
        try:
            # Each copy is its own document so it feeds and cuts separately —
            # staff want two slips, not one long one.
            for _ in range(copies):
                spooler_ids.append(
                    spool.send_raw(PRINTER, payload, f"CKD-Ticket job {job_id}")
                )
        except Exception as exc:
            log.exception("spool failed")
            return {"type": "result", "job_id": job_id, "ok": False,
                    "retryable": True, "error": str(exc),
                    "copies_done": len(spooler_ids)}

        return {"type": "result", "job_id": job_id, "ok": True,
                "spooler_job_id": spooler_ids[0] if spooler_ids else None,
                "copies": copies, "bytes": len(payload)}

    return {"type": "error", "error": f"unknown cmd {cmd!r}"}


def main() -> int:
    _emit({"type": "ready", "schema": compose.SCHEMA_VERSION,
           "printer": PRINTER, "dump_mode": bool(DUMP_DIR),
           "paper_dots": escpos.PAPER_WIDTH_DOTS})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError as exc:
            _emit({"type": "error", "error": f"bad json: {exc}"})
            continue

        if msg.get("cmd") == "quit":
            break
        try:
            reply = _handle(msg)
        except Exception as exc:  # a worker crash must not take the backend down
            log.exception("unhandled")
            reply = {"type": "result", "job_id": msg.get("job_id"),
                     "ok": False, "retryable": True, "error": str(exc)}
        if reply:
            _emit(reply)
    return 0


if __name__ == "__main__":
    sys.exit(main())
