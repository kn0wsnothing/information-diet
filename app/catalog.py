"""Validated private source catalog.  Catalog JSON stays outside this repository."""

from datetime import datetime
from urllib.parse import urlparse

REQUIRED = ("id", "kind", "title", "summary", "why", "url", "inspection_method", "inspected_at", "provenance")


def validate_candidate(item: dict) -> dict:
    if not isinstance(item, dict):
        raise ValueError("candidate must be an object")
    missing = [key for key in REQUIRED if not item.get(key)]
    if missing:
        raise ValueError("candidate missing: " + ", ".join(missing))
    if item["kind"] not in {"video", "read"}:
        raise ValueError("candidate kind must be video or read")
    if not all(isinstance(item[key], str) for key in REQUIRED):
        raise ValueError("candidate required fields must be strings")
    if item["kind"] == "video" and (not isinstance(item.get("duration_minutes"), int) or item["duration_minutes"] < 1):
        raise ValueError("video requires positive duration_minutes")
    if urlparse(item["url"]).scheme not in {"https", "http"}:
        raise ValueError("candidate url must be a direct http(s) link")
    if item["kind"] == "video":
        if not isinstance(item.get("source_url"), str) or urlparse(item["source_url"]).scheme not in {"https", "http"}:
            raise ValueError("video requires original source_url")
        reader_url = item.get("reader_url")
        if reader_url is not None:
            if not isinstance(reader_url, str):
                raise ValueError("reader_url must be a verified Readwise Reader document")
            reader = urlparse(reader_url)
            if reader.scheme != "https" or reader.netloc != "read.readwise.io" or not reader.path.startswith("/read/"):
                raise ValueError("reader_url must be a verified Readwise Reader document")
            if item["url"] != reader_url:
                raise ValueError("saved video url must equal reader_url")
        elif item["url"] != item["source_url"]:
            raise ValueError("unsaved video url must equal source_url")
    # A podcast URL is only usable when an inspection explicitly verified it.
    if "podcast_verified" in item and not isinstance(item["podcast_verified"], bool):
        raise ValueError("podcast_verified must be boolean")
    if item.get("podcast_url") and item.get("podcast_verified") is not True:
        raise ValueError("podcast_url requires podcast_verified=true")
    if item.get("podcast_url") and urlparse(item["podcast_url"]).scheme not in {"https", "http"}:
        raise ValueError("podcast_url must be http(s)")
    try:
        datetime.fromisoformat(item["inspected_at"])
    except ValueError as error:
        raise ValueError("inspected_at must be ISO-8601") from error
    return item


def validate_catalog(payload: dict) -> dict:
    candidates = payload.get("candidates")
    if not isinstance(candidates, list):
        raise ValueError("catalog requires candidates list")
    seen = set()
    for candidate in candidates:
        validate_candidate(candidate)
        if candidate["id"] in seen:
            raise ValueError("duplicate candidate id: " + candidate["id"])
        seen.add(candidate["id"])
    return payload
