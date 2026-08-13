#!/usr/bin/env python3
"""Verify an S3-compatible bucket with a disposable object."""

import sys
from pathlib import Path
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.storage import get_storage_service


def main() -> None:
    storage = get_storage_service()
    payload = b"jansarthi-storage-smoke"
    object_name = storage.upload_file(payload, "storage-smoke.txt", "text/plain")
    try:
        with urlopen(storage.get_file_url(object_name), timeout=20) as response:
            if response.read() != payload:
                raise RuntimeError("Downloaded smoke object did not match uploaded data")
    finally:
        if not storage.delete_file(object_name):
            raise RuntimeError("Failed to remove storage smoke object")

    print("Storage upload, signed download, and cleanup passed.")


if __name__ == "__main__":
    main()
