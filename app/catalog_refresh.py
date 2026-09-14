"""Build a private catalog only from locally inspected source material."""

import copy
import json
import os
import tempfile
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from .catalog import validate_catalog


def default_url_checker(url: str) -> bool:
    try:
        request = Request(url, method="HEAD", headers={"User-Agent": "information-diet/1.0"})
        with urlopen(request, timeout=15) as response:
            return 200 <= response.status < 400
    except HTTPError as error:
        # These responses still establish that the specific endpoint exists.
        return error.code in {401, 403, 429}
    except OSError:
        return False


def validate_manifest(manifest: dict, read_text=Path.read_text, url_checker=default_url_checker) -> dict:
    """Return a catalog with inspection recipes removed, or raise ValueError."""
    if not isinstance(manifest, dict) or not isinstance(manifest.get("candidates"), list):
        raise ValueError("manifest requires a candidates list")
    if not isinstance(manifest.get("book"), dict) or not isinstance(manifest["book"].get("nonfiction_title"), str):
        raise ValueError("manifest requires nonfiction book state")
    catalog = copy.deepcopy(manifest)
    for candidate in catalog["candidates"]:
        if not isinstance(candidate, dict):
            raise ValueError("candidate must be an object")
        inspection = candidate.pop("inspection", None)
        if not isinstance(inspection, dict):
            raise ValueError("candidate requires inspection recipe")
        path, minimum_words, terms = (
            inspection.get("source_path"),
            inspection.get("minimum_words"),
            inspection.get("evidence_terms"),
        )
        if (
            not isinstance(path, str)
            or not isinstance(minimum_words, int)
            or minimum_words < 1
            or not isinstance(terms, list)
            or not terms
            or not all(isinstance(x, str) and x for x in terms)
        ):
            raise ValueError("invalid inspection recipe")
        try:
            text = read_text(Path(path), encoding="utf-8")
        except (OSError, TypeError) as error:
            raise ValueError(f"inspection source unavailable: {path}") from error
        words = text.split()
        missing = [term for term in terms if term.casefold() not in text.casefold()]
        if len(words) < minimum_words or missing:
            raise ValueError(f"inspection evidence failed for {candidate.get('id', 'candidate')}")
        # The original source is the public watch action. Reader provenance, when
        # present, is separately verified and stays out of the rendered watch URL.
        if candidate.get("kind") == "video":
            fields = (
                ("source_url", "reader_url", "podcast_url", "snipd_url")
                if candidate.get("reader_url")
                else ("source_url", "podcast_url", "snipd_url")
            )
        else:
            fields = ("url", "podcast_url")
        for url_field in fields:
            if candidate.get(url_field) and not url_checker(candidate[url_field]):
                raise ValueError(f"unreachable {url_field} for {candidate.get('id', 'candidate')}")
    try:
        return validate_catalog(catalog)
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError(f"invalid catalog schema: {error}") from error


def refresh_catalog(
    manifest_path: str, catalog_path: str, read_text=Path.read_text, url_checker=default_url_checker
) -> dict:
    try:
        manifest = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, TypeError) as error:
        raise ValueError(f"manifest load failed: {error}") from error
    catalog = validate_manifest(manifest, read_text=read_text, url_checker=url_checker)
    destination = Path(catalog_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".catalog-", dir=destination.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(catalog, handle, ensure_ascii=False)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, destination)
    except Exception:
        try:
            os.unlink(temporary)
        except OSError:
            pass
        raise
    return catalog
