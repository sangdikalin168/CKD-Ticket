"""Build the desktop exe and publish it for auto-update.

    python release.py                 # build at the current version
    python release.py --bump patch    # 1.0.0 -> 1.0.1, then build
    python release.py --publish       # also upload to the server over SSH

Produces, in dist/:
    CKD-Ticket.exe
    latest.json   {"version", "sha256", "url", "size", "notes"}

The manifest's sha256 is what makes this safe: the updater refuses any download
whose hash does not match, so a truncated transfer or a swapped file can never
be staged. Publishing copies both into the server's DESKTOP_DIR, which
express.static serves at /desktop.

Version numbers must only ever go up — a till compares tuples and ignores
anything that is not strictly newer, so re-publishing an older build is a no-op
rather than a downgrade.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VERSION_FILE = HERE / "ckd_desktop" / "version.py"
DIST = HERE / "dist"
EXE_NAME = "CKD-Ticket.exe"


def read_version() -> str:
    m = re.search(r'__version__\s*=\s*"([^"]+)"', VERSION_FILE.read_text(encoding="utf-8"))
    if not m:
        sys.exit("could not find __version__ in version.py")
    return m.group(1)


def bump(part: str) -> str:
    major, minor, patch = (int(x) for x in read_version().split("."))
    if part == "major":
        major, minor, patch = major + 1, 0, 0
    elif part == "minor":
        minor, patch = minor + 1, 0
    else:
        patch += 1
    new = f"{major}.{minor}.{patch}"
    text = VERSION_FILE.read_text(encoding="utf-8")
    VERSION_FILE.write_text(
        re.sub(r'__version__\s*=\s*"[^"]+"', f'__version__ = "{new}"', text),
        encoding="utf-8",
    )
    print(f"version -> {new}")
    return new


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def build() -> Path:
    python = HERE / ".venv" / "Scripts" / "python.exe"
    if not python.is_file():
        python = Path(sys.executable)
    cmd = [
        str(python), "-m", "PyInstaller", "--noconfirm", "--onefile", "--windowed",
        "--name", "CKD-Ticket",
        "--add-data", "ckd_desktop/bridge.js;ckd_desktop",
        "--hidden-import", "ckd_desktop.fp_enroll",
        "--collect-all", "webview",
    ]
    # Club logo as the exe icon (taskbar, title bar, Explorer). Built from
    # assets/logo.png by make_icon.py; skipped, with a warning, if absent so a
    # missing asset never blocks a release.
    icon = HERE / "assets" / "icon.ico"
    if icon.is_file():
        cmd += ["--icon", str(icon)]
    else:
        print(f"warning: {icon} not found - exe will have the default icon "
              "(run make_icon.py after saving assets/logo.png)")
    cmd.append("main.py")
    print("building…")
    subprocess.run(cmd, cwd=HERE, check=True)
    exe = DIST / EXE_NAME
    if not exe.is_file():
        sys.exit(f"build produced no {exe}")
    return exe


def write_manifest(exe: Path, version: str, notes: str) -> Path:
    manifest = {
        "version": version,
        "sha256": sha256(exe),
        # Relative so it resolves against whatever host the till talks to.
        "url": f"/desktop/{EXE_NAME}",
        "size": exe.stat().st_size,
        "notes": notes,
    }
    path = DIST / "latest.json"
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"manifest: {version}  sha256={manifest['sha256'][:16]}…  {manifest['size']} bytes")
    return path


def publish(exe: Path, manifest: Path) -> None:
    """Copy the build to the server's DESKTOP_DIR over SSH (key auth)."""
    host = os.environ.get("CKD_SSH_HOST")
    user = os.environ.get("CKD_SSH_USER")
    remote = os.environ.get("CKD_DESKTOP_DIR", r"D:\CKD-System\shared\desktop")
    if not host or not user:
        sys.exit("set CKD_SSH_HOST and CKD_SSH_USER to publish")

    target = f"{user}@{host}"
    subprocess.run(["ssh", "-o", "BatchMode=yes", target,
                    f'cmd /c if not exist "{remote}" mkdir "{remote}"'], check=True)
    # exe first, manifest last: a till that checks mid-publish must never see a
    # manifest advertising a build that is not fully uploaded yet.
    for f in (exe, manifest):
        subprocess.run(["scp", "-o", "BatchMode=yes", str(f), f"{target}:{remote}\\{f.name}"], check=True)
    print(f"published to {target}:{remote}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--bump", choices=["major", "minor", "patch"])
    ap.add_argument("--notes", default="")
    ap.add_argument("--publish", action="store_true")
    args = ap.parse_args()

    version = bump(args.bump) if args.bump else read_version()
    exe = build()
    manifest = write_manifest(exe, version, args.notes)
    if args.publish:
        publish(exe, manifest)
    else:
        print("\nnot published (pass --publish, or copy dist/ into the server's shared\\desktop)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
