"""Explicit synthetic CPU load, not model inference. Terminate process to cancel."""
import hashlib
import json
import time
started = time.monotonic()
value = b'omnipresent-runtime-probe'
while time.monotonic() - started < 8:
    value = hashlib.sha256(value).digest()
print(json.dumps({'type': 'load_done', 'elapsedMs': (time.monotonic()-started)*1000}), flush=True)
