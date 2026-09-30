"""
Local filesystem storage provider.

Stores files under settings.STORAGE_PATH and returns a URL-friendly path
that maps to the /uploads static mount in main.py.
"""
import os
import shutil
import uuid
from typing import BinaryIO

from app.core.config import settings


class LocalStorage:
    def __init__(self, base_path: str | None = None):
        self.base_path = base_path or settings.STORAGE_PATH

    def _ensure_dir(self, sub: str = "") -> str:
        target = os.path.join(self.base_path, sub) if sub else self.base_path
        os.makedirs(target, exist_ok=True)
        return target

    def save(self, file_obj: BinaryIO, original_filename: str, sub: str = "") -> str:
        """
        Save *file_obj* and return the stored filename (not the full path).
        The caller can compose the public URL as /uploads/{filename}.
        """
        directory = self._ensure_dir(sub)
        ext = os.path.splitext(original_filename)[1].lower() if original_filename else ".bin"
        filename = f"{uuid.uuid4()}{ext}"
        if sub:
            filename = os.path.join(sub, filename)
        dest = os.path.join(self.base_path, filename)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            shutil.copyfileobj(file_obj, f)
        return filename

    def delete(self, filename: str) -> bool:
        """Delete a file by its stored filename. Returns True if deleted."""
        path = os.path.join(self.base_path, filename)
        if os.path.exists(path):
            os.remove(path)
            return True
        return False

    def exists(self, filename: str) -> bool:
        return os.path.exists(os.path.join(self.base_path, filename))

    def full_path(self, filename: str) -> str:
        return os.path.join(self.base_path, filename)


# Singleton instance used by services
local_storage = LocalStorage()
