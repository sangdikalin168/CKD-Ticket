"""RAW write to a named Windows printer.

pywin32 rather than a hand-rolled P/Invoke on purpose. Writing this by hand is
where the 1804 ERROR_INVALID_DATATYPE trap lives: the widely-copied
RawPrinterHelper binds StartDocPrinterA while marshalling a Unicode DOCINFO, so
the driver reads the "RAW" datatype as garbage and rejects the job. That exact
failure was hit and confirmed on this server. win32print binds the W variants
consistently, so the problem cannot occur.

The printer is always named explicitly. The CKD-Ticket server has NO default
printer set, so anything relying on "the default" silently fails there.
"""
from __future__ import annotations

import logging

log = logging.getLogger("ckd_print.spool")


class SpoolError(RuntimeError):
    pass


def list_printers() -> list[str]:
    import win32print

    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    return [p[2] for p in win32print.EnumPrinters(flags)]


def printer_status(name: str) -> dict:
    import win32print

    handle = win32print.OpenPrinter(name)
    try:
        info = win32print.GetPrinter(handle, 2)
        return {
            "name": name,
            "status": info.get("Status", 0),
            "jobs_queued": info.get("cJobs", 0),
            "port": info.get("pPortName"),
            "driver": info.get("pDriverName"),
        }
    finally:
        win32print.ClosePrinter(handle)


def send_raw(printer: str, payload: bytes, doc_name: str = "CKD-Ticket receipt") -> int:
    """Write bytes straight to the spooler. Returns the spooler job id."""
    import win32print

    if not payload:
        raise SpoolError("refusing to spool an empty job")

    try:
        handle = win32print.OpenPrinter(printer)
    except Exception as exc:
        raise SpoolError(f"cannot open printer {printer!r}: {exc}") from exc

    try:
        job_id = win32print.StartDocPrinter(handle, 1, (doc_name, None, "RAW"))
        try:
            win32print.StartPagePrinter(handle)
            written = win32print.WritePrinter(handle, payload)
            win32print.EndPagePrinter(handle)
            if written != len(payload):
                raise SpoolError(f"short write: {written} of {len(payload)} bytes")
        finally:
            win32print.EndDocPrinter(handle)
        log.info("spooled job %s to %s (%d bytes)", job_id, printer, len(payload))
        return job_id
    finally:
        win32print.ClosePrinter(handle)
