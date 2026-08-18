"""CKD-Ticket server-side receipt printing.

Standalone: the print logic is adapted from CKD-POS, but CKD-Ticket is a
separate system on a separate machine and nothing here couples to it at runtime.
"""

__all__ = ["compose", "escpos", "qr", "render", "spool"]
