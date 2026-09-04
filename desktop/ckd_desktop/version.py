"""Single source of truth for the desktop host's version.

Bumped by scripts/build.ps1, which also writes the matching number into the
published manifest. Keep it PEP 440 / dotted-numeric: updater.py compares these
as integer tuples, so "1.2.10" correctly beats "1.2.9".
"""

__version__ = "1.0.11"
