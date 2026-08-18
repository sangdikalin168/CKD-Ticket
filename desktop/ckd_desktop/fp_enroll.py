"""Enroll-only ZKFinger sidecar for the CKD-Ticket Electron app.

A self-contained child process (no pip deps — Python stdlib + libzkfp.dll) that
drives a ZKFinger reader for fingerprint ENROLLMENT only. It is a trimmed port of
CKD-Check-In/ckd_checkin/fingerprint.py with all GraphQL/DB access and 1:N matching
removed — the Electron renderer owns saving (via the checkinSaveFingerprint mutation).

Protocol (newline-delimited JSON, UTF-8):
  parent -> child (stdin):
    {"cmd": "begin", "customer_id": 123}
    {"cmd": "cancel"}
    {"cmd": "quit"}
  child -> parent (stdout):
    {"type": "status", "message": "..."}
    {"type": "enroll_progress", "captured": N, "total": 3}
    {"type": "enroll_complete", "customer_id": 123, "template": "<base64>"}
    {"type": "enroll_error", "message": "..."}
    {"type": "enroll_cancelled"}
  Diagnostics go to stderr only — stdout carries protocol JSON exclusively.
"""
from __future__ import annotations

import base64
import ctypes
import json
import logging
import os
import queue
import sys
import threading
import time
from ctypes import POINTER, byref, c_int, c_ubyte, c_uint, c_void_p

log = logging.getLogger("fp_enroll")

ERR_OK = 0
PARAM_IMAGE_WIDTH = 1
PARAM_IMAGE_HEIGHT = 2
TEMPLATE_BUF_SIZE = 2048
ENROLL_SAMPLES_REQUIRED = 3


class ZKFingerError(RuntimeError):
    pass


def _load_dll():
    try:
        return ctypes.WinDLL("libzkfp.dll")
    except OSError as e:
        raise ZKFingerError(
            "Could not load libzkfp.dll. Install the ZKFinger SDK 5.x."
        ) from e


class _SDK:
    """Lazy singleton wrapping the libzkfp.dll signatures needed for enrollment."""

    _instance: "_SDK | None" = None

    @classmethod
    def get(cls) -> "_SDK":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        dll = _load_dll()
        self.dll = dll

        dll.ZKFPM_Init.restype = c_int
        dll.ZKFPM_Init.argtypes = []

        dll.ZKFPM_Terminate.restype = c_int
        dll.ZKFPM_Terminate.argtypes = []

        dll.ZKFPM_GetDeviceCount.restype = c_int
        dll.ZKFPM_GetDeviceCount.argtypes = []

        dll.ZKFPM_OpenDevice.restype = c_void_p
        dll.ZKFPM_OpenDevice.argtypes = [c_int]

        dll.ZKFPM_CloseDevice.restype = c_int
        dll.ZKFPM_CloseDevice.argtypes = [c_void_p]

        dll.ZKFPM_GetParameters.restype = c_int
        dll.ZKFPM_GetParameters.argtypes = [
            c_void_p,
            c_int,
            POINTER(c_ubyte),
            POINTER(c_uint),
        ]

        dll.ZKFPM_AcquireFingerprint.restype = c_int
        dll.ZKFPM_AcquireFingerprint.argtypes = [
            c_void_p,
            POINTER(c_ubyte),
            c_uint,
            POINTER(c_ubyte),
            POINTER(c_uint),
        ]

        # DBInit/DBFree are needed only because GenRegTemplate/DBMerge takes the
        # DB handle as its first argument.
        dll.ZKFPM_DBInit.restype = c_void_p
        dll.ZKFPM_DBInit.argtypes = []

        dll.ZKFPM_DBFree.restype = c_int
        dll.ZKFPM_DBFree.argtypes = [c_void_p]

        # Merges 3 same-finger samples into a single registration template.
        # SDK build varies — try both known export names.
        self.gen_reg_template = None
        for name in ("ZKFPM_GenRegTemplate", "ZKFPM_DBMerge"):
            try:
                fn = getattr(dll, name)
            except AttributeError:
                continue
            fn.restype = c_int
            fn.argtypes = [
                c_void_p,
                POINTER(c_ubyte),
                POINTER(c_ubyte),
                POINTER(c_ubyte),
                POINTER(c_ubyte),
                POINTER(c_uint),
            ]
            self.gen_reg_template = fn
            break


class FingerprintReader:
    """Background fingerprint capture + enrollment (3 samples -> merged template).

    Events are published to ``self.events`` (queue.Queue) as dicts:
        {"type": "status",           "message": str}
        {"type": "enroll_progress",  "captured": int, "total": int}
        {"type": "enroll_complete",  "customer_id": int, "template": str (b64)}
        {"type": "enroll_error",     "message": str}
        {"type": "enroll_cancelled"}
    """

    def __init__(self) -> None:
        self._sdk = _SDK.get()
        self.events: "queue.Queue[dict]" = queue.Queue()
        self.width = 0
        self.height = 0

        self._handle: int | None = None
        self._db_handle: int | None = None
        self._sdk_initialized = False
        self._thread: threading.Thread | None = None
        self._stop_flag = threading.Event()
        self._last_status: str | None = None

        # Enrollment state — mutated only from the supervisor thread except for
        # the entry/exit transitions in begin_enrollment/cancel_enrollment.
        # Python attribute writes are atomic under the GIL, so a brief race at
        # the boundary just costs one stray sample at worst.
        self._enroll_mode = False
        self._enroll_customer_id: int | None = None
        self._enroll_samples: list[bytes] = []

    def start(self) -> None:
        if self._thread is not None:
            return
        self._stop_flag.clear()
        self._thread = threading.Thread(target=self._supervisor_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_flag.set()
        if self._thread is not None:
            self._thread.join(timeout=2)
            self._thread = None
        self._close_device()
        dll = self._sdk.dll
        if self._db_handle is not None:
            try:
                dll.ZKFPM_DBFree(self._db_handle)
            except Exception:
                pass
            self._db_handle = None
        if self._sdk_initialized:
            try:
                dll.ZKFPM_Terminate()
            except Exception:
                pass
            self._sdk_initialized = False

    def _publish_status(self, message: str) -> None:
        if message != self._last_status:
            self._last_status = message
            self.events.put({"type": "status", "message": message})

    def _ensure_sdk(self) -> bool:
        if self._sdk_initialized:
            return True
        dll = self._sdk.dll
        rc = dll.ZKFPM_Init()
        if rc != ERR_OK:
            self._publish_status(f"Fingerprint: SDK init failed (rc={rc}), retrying…")
            return False
        self._sdk_initialized = True
        self._db_handle = dll.ZKFPM_DBInit()
        if not self._db_handle:
            dll.ZKFPM_Terminate()
            self._sdk_initialized = False
            self._publish_status("Fingerprint: DBInit failed, retrying…")
            return False
        return True

    def _ensure_device(self) -> bool:
        if self._handle is not None:
            return True
        dll = self._sdk.dll
        if dll.ZKFPM_GetDeviceCount() <= 0:
            self._publish_status("Fingerprint: waiting for device…")
            return False
        handle = dll.ZKFPM_OpenDevice(0)
        if not handle:
            self._publish_status("Fingerprint: OpenDevice failed, retrying…")
            return False
        self._handle = handle
        try:
            self.width = self._read_int_param(PARAM_IMAGE_WIDTH)
            self.height = self._read_int_param(PARAM_IMAGE_HEIGHT)
        except ZKFingerError as ex:
            log.warning("read params failed: %s", ex)
            self._close_device()
            return False
        self._publish_status("Fingerprint ready")
        return True

    def _close_device(self) -> None:
        if self._handle is not None:
            try:
                self._sdk.dll.ZKFPM_CloseDevice(self._handle)
            except Exception:
                pass
            self._handle = None

    def _teardown_sdk(self) -> None:
        """Force a full SDK refresh so the next Init re-enumerates USB devices."""
        self._close_device()
        dll = self._sdk.dll
        if self._db_handle is not None:
            try:
                dll.ZKFPM_DBFree(self._db_handle)
            except Exception:
                pass
            self._db_handle = None
        if self._sdk_initialized:
            try:
                dll.ZKFPM_Terminate()
            except Exception:
                pass
            self._sdk_initialized = False

    def _read_int_param(self, code: int) -> int:
        buf = (c_ubyte * 4)()
        size = c_uint(4)
        rc = self._sdk.dll.ZKFPM_GetParameters(self._handle, code, buf, byref(size))
        if rc != ERR_OK:
            raise ZKFingerError(f"ZKFPM_GetParameters({code}) failed: rc={rc}")
        return int.from_bytes(bytes(buf), byteorder="little", signed=True)

    def _supervisor_loop(self) -> None:
        """Manage SDK init, device open, capture, and hot-plug recovery."""
        dll = self._sdk.dll
        img_buf = None
        tmpl_buf = (c_ubyte * TEMPLATE_BUF_SIZE)()
        idle_ticks = 0

        while not self._stop_flag.is_set():
            if not self._ensure_sdk():
                if self._stop_flag.wait(2.0):
                    return
                continue
            if not self._ensure_device():
                if self._stop_flag.wait(1.0):
                    return
                continue

            needed = self.width * self.height
            if img_buf is None or len(img_buf) != needed:
                img_buf = (c_ubyte * needed)()

            tmpl_size = c_uint(TEMPLATE_BUF_SIZE)
            rc = dll.ZKFPM_AcquireFingerprint(
                self._handle,
                img_buf,
                len(img_buf),
                tmpl_buf,
                byref(tmpl_size),
            )
            if rc == ERR_OK:
                # Only collect samples while enrolling; otherwise ignore the
                # capture (this sidecar does no 1:N matching).
                if self._enroll_mode:
                    self._on_enroll_capture(tmpl_buf, tmpl_size.value)
                idle_ticks = 0
            else:
                # AcquireFingerprint returns non-OK for both "no finger" and
                # "device gone", and GetDeviceCount caches a stale count even
                # after unplug. Every ~3 s of failures, tear the SDK down so the
                # next _ensure_sdk forces a fresh USB enumeration via Init.
                idle_ticks += 1
                if idle_ticks >= 50:
                    idle_ticks = 0
                    self._teardown_sdk()
                    continue

            if self._stop_flag.wait(0.1):
                return

    # ------------------------------------------------------------
    # Enrollment
    # ------------------------------------------------------------
    def begin_enrollment(self, customer_id: int) -> None:
        self._enroll_customer_id = int(customer_id)
        self._enroll_samples = []
        self._enroll_mode = True
        self.events.put(
            {
                "type": "enroll_progress",
                "captured": 0,
                "total": ENROLL_SAMPLES_REQUIRED,
            }
        )

    def cancel_enrollment(self) -> None:
        if not self._enroll_mode:
            self.events.put({"type": "enroll_cancelled"})
            return
        self._enroll_mode = False
        self._enroll_samples = []
        self._enroll_customer_id = None
        self.events.put({"type": "enroll_cancelled"})

    def _on_enroll_capture(self, tmpl_buf, tmpl_size: int) -> None:
        sample = bytes((c_ubyte * tmpl_size).from_buffer(tmpl_buf, 0))
        self._enroll_samples.append(sample)
        captured = len(self._enroll_samples)
        self.events.put(
            {
                "type": "enroll_progress",
                "captured": captured,
                "total": ENROLL_SAMPLES_REQUIRED,
            }
        )
        if captured >= ENROLL_SAMPLES_REQUIRED:
            self._finalize_enrollment()

    def _finalize_enrollment(self) -> None:
        cid = self._enroll_customer_id
        samples = self._enroll_samples
        # Reset state first so a failed merge ends enrollment cleanly.
        self._enroll_mode = False
        self._enroll_samples = []
        self._enroll_customer_id = None

        if cid is None or len(samples) < ENROLL_SAMPLES_REQUIRED:
            self.events.put({"type": "enroll_error", "message": "incomplete enrollment"})
            return
        if self._db_handle is None:
            self.events.put({"type": "enroll_error", "message": "SDK DB handle missing"})
            return
        if self._sdk.gen_reg_template is None:
            self.events.put(
                {
                    "type": "enroll_error",
                    "message": "libzkfp.dll does not export GenRegTemplate/DBMerge",
                }
            )
            return

        s1, s2, s3 = samples[0], samples[1], samples[2]
        a1 = (c_ubyte * len(s1)).from_buffer_copy(s1)
        a2 = (c_ubyte * len(s2)).from_buffer_copy(s2)
        a3 = (c_ubyte * len(s3)).from_buffer_copy(s3)
        out_buf = (c_ubyte * TEMPLATE_BUF_SIZE)()
        out_size = c_uint(TEMPLATE_BUF_SIZE)
        rc = self._sdk.gen_reg_template(
            self._db_handle, a1, a2, a3, out_buf, byref(out_size)
        )
        if rc != ERR_OK:
            self.events.put(
                {"type": "enroll_error", "message": f"GenRegTemplate failed: rc={rc}"}
            )
            return

        template = bytes(out_buf[: out_size.value])
        template_b64 = base64.b64encode(template).decode("ascii")
        self.events.put(
            {
                "type": "enroll_complete",
                "customer_id": cid,
                "template": template_b64,
            }
        )


# ---------------------------------------------------------------------------
# Sidecar glue: stdin commands -> reader; reader events -> stdout
# ---------------------------------------------------------------------------

_emit_lock = threading.Lock()


def _emit(evt: dict) -> None:
    line = json.dumps(evt, ensure_ascii=False)
    try:
        with _emit_lock:
            sys.stdout.write(line + "\n")
            sys.stdout.flush()
    except (BrokenPipeError, ValueError):
        # Parent closed the pipe — nothing more we can do.
        os._exit(0)


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        stream=sys.stderr,
        format="%(asctime)s %(levelname)s fp_enroll: %(message)s",
    )
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

    reader: FingerprintReader | None = None
    init_error: str | None = None
    try:
        reader = FingerprintReader()
        reader.start()
    except ZKFingerError as ex:
        init_error = str(ex)
        log.warning("fingerprint init failed: %s", ex)
    except Exception as ex:  # noqa: BLE001
        init_error = f"fingerprint init error: {ex}"
        log.exception("fingerprint init error")

    stop = threading.Event()

    def pump() -> None:
        while not stop.is_set():
            if reader is None:
                time.sleep(0.2)
                continue
            try:
                evt = reader.events.get(timeout=0.2)
            except queue.Empty:
                continue
            _emit(evt)

    pump_thread = threading.Thread(target=pump, daemon=True, name="fp-pump")
    pump_thread.start()

    # Command loop (main thread). Ends on "quit" or stdin EOF (parent gone).
    while True:
        line = sys.stdin.readline()
        if line == "":  # EOF
            break
        line = line.strip()
        if not line:
            continue
        try:
            cmd = json.loads(line)
        except ValueError:
            log.warning("ignoring bad command line: %r", line)
            continue

        action = cmd.get("cmd")
        if action == "begin":
            cid = int(cmd.get("customer_id") or 0)
            if reader is None:
                _emit(
                    {
                        "type": "enroll_error",
                        "message": init_error or "fingerprint reader not available",
                    }
                )
            elif cid <= 0:
                _emit({"type": "enroll_error", "message": "invalid customer_id"})
            else:
                try:
                    reader.begin_enrollment(cid)
                except Exception as ex:  # noqa: BLE001
                    _emit({"type": "enroll_error", "message": str(ex)})
        elif action == "cancel":
            if reader is not None:
                reader.cancel_enrollment()
            else:
                _emit({"type": "enroll_cancelled"})
        elif action == "quit":
            break
        else:
            log.warning("unknown cmd: %r", action)

    stop.set()
    if reader is not None:
        try:
            reader.stop()
        except Exception:
            pass
    sys.exit(0)


if __name__ == "__main__":
    main()
