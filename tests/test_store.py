import json
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path

from app.catalog import validate_catalog
from app.catalog_refresh import refresh_catalog, validate_manifest
from app.store import Store

BOOK = {
    "nonfiction_title": "Synthetic Pepys",
    "author": "Tester",
    "total_pages": 385,
    "reported_page": 46,
    "daily_pace": 7,
    "fiction_title": "Synthetic fiction",
}
CATALOG = {
    "book": BOOK,
    "candidates": [
        {
            "id": "video-1",
            "kind": "video",
            "title": "A real inspected video",
            "summary": "A content summary.",
            "why": "A reason.",
            "url": "https://example.test/watch",
            "duration_minutes": 97,
            "stopping_point": "1:00:33",
            "podcast_url": "https://example.test/podcast",
            "podcast_verified": True,
            "inspection_method": "full transcript",
            "inspected_at": "2026-09-14T00:00:00Z",
            "provenance": "operator",
        },
        {
            "id": "video-2",
            "kind": "video",
            "title": "A second inspected video",
            "summary": "A second content summary.",
            "why": "A second reason.",
            "url": "https://example.test/watch-2",
            "duration_minutes": 45,
            "inspection_method": "full transcript",
            "inspected_at": "2026-09-14T00:00:00Z",
            "provenance": "operator",
        },
        {
            "id": "read-1",
            "kind": "read",
            "title": "An inspected read",
            "summary": "A content summary.",
            "why": "A reason.",
            "url": "https://example.test/read",
            "inspection_method": "full text",
            "inspected_at": "2026-09-14T00:00:00Z",
            "provenance": "operator",
        },
    ],
}


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.db = str(Path(self.dir.name) / "state.sqlite3")
        self.store = Store(self.db)
        self.store.setup()
        self.store.seed_books(BOOK)

    def tearDown(self):
        self.dir.cleanup()

    def test_list_persists_and_target_is_fixed(self):
        self.assertTrue(self.store.generate("2026-09-14", CATALOG, "now"))
        self.store.feedback(1, "not_started", book_page=50, now="now")
        reopened = Store(self.db)
        daily = reopened.get_list("2026-09-14")
        self.assertEqual(daily["book_target"], 53)
        self.assertEqual(reopened.book()["reported_page"], 50)
        reopened.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(reopened.get_list("2026-09-15")["book_target"], 57)

    def test_feedback_isolated_and_rejection_does_not_drop_author(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(1, "not_interesting", reason="one item", now="now")
        self.assertEqual(self.store.get_list("2026-09-14")["picks"][1]["state"], "active")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][0]["candidate_id"], "video-2")

    def test_continue_carries_timestamp_and_completed_is_excluded(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(1, "continue", video_timestamp="1:02:03", now="now")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][0]["candidate_id"], "video-1")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][0]["last_video_timestamp"], "1:02:03")
        self.store.feedback(3, "completed", now="now")
        self.store.generate("2026-09-16", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-16")["picks"][0]["candidate_id"], "video-2")

    def test_not_started_refresh_reconsiders_without_rejection(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(1, "not_started", now="now")
        self.assertTrue(self.store.generate("2026-09-14", CATALOG, "now", refresh=True))
        self.assertEqual(self.store.get_list("2026-09-14")["picks"][0]["candidate_id"], "video-2")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][0]["candidate_id"], "video-2")

    def test_refresh_history_is_candidate_specific_and_latest_wins(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(1, "not_started", now="one")
        self.store.feedback(1, "continue", video_timestamp="0:22:00", now="two")
        self.assertFalse(self.store.generate("2026-09-14", CATALOG, "now", refresh=True))
        self.assertEqual(self.store.get_list("2026-09-14")["picks"][0]["candidate_id"], "video-1")
        self.store.feedback(1, "not_started", now="three")
        self.assertTrue(self.store.generate("2026-09-14", CATALOG, "now", refresh=True))
        self.assertEqual(self.store.get_list("2026-09-14")["picks"][0]["candidate_id"], "video-2")
        self.assertFalse(self.store.generate("2026-09-14", CATALOG, "now", refresh=True))

    def test_stale_feedback_cannot_mutate_a_replacement(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(1, "not_started", now="one", expected_candidate_id="video-1")
        self.store.generate("2026-09-14", CATALOG, "now", refresh=True)
        with self.assertRaises(ValueError):
            self.store.feedback(1, "completed", now="two", expected_candidate_id="video-1")
        pick = self.store.get_list("2026-09-14")["picks"][0]
        self.assertEqual(pick["candidate_id"], "video-2")
        self.assertEqual(pick["state"], "active")

    def test_unanswered_video_carries_without_becoming_backlog(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        reordered = {
            **CATALOG,
            "candidates": [CATALOG["candidates"][1], CATALOG["candidates"][0], CATALOG["candidates"][2]],
        }
        self.store.generate("2026-09-15", reordered, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][0]["candidate_id"], "video-1")

    def test_not_started_does_not_become_next_day_backlog(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(1, "not_started", now="now")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][0]["candidate_id"], "video-2")

    def test_overlap_is_idempotent(self):
        outcomes = []

        def run():
            outcomes.append(self.store.generate("2026-09-14", CATALOG, "now"))

        threads = [threading.Thread(target=run) for _ in range(4)]
        [t.start() for t in threads]
        [t.join() for t in threads]
        self.assertEqual(outcomes.count(True), 1)
        self.assertEqual(len(self.store.get_list("2026-09-14")["picks"]), 2)

    def test_overlapping_feedback_is_recorded(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        threads = [
            threading.Thread(target=lambda: self.store.feedback(1, "not_started", now="one")),
            threading.Thread(target=lambda: self.store.feedback(1, "continue", video_timestamp="0:10:00", now="two")),
        ]
        [t.start() for t in threads]
        [t.join() for t in threads]
        with sqlite3.connect(self.db) as conn:
            self.assertEqual(conn.execute("SELECT count(*) FROM feedback").fetchone()[0], 2)
        self.assertEqual(self.store.get_list("2026-09-14")["picks"][0]["last_video_timestamp"], "0:10:00")

    def test_source_failure_keeps_last_usable_list(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.assertTrue(self.store.generate("2026-09-15", CATALOG, "now", source_failure="offline"))
        self.assertEqual(self.store.get_list("2026-09-15")["status"], "failed")
        self.assertEqual(self.store.latest_list()["date"], "2026-09-14")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["status"], "ready")

    def test_book_bounds_and_fiction_is_untracked(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-14")["book_target"], 53)
        self.store.report_book_page(385)
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["book_target"], 385)
        with self.assertRaises(ValueError):
            self.store.report_book_page(386)
        self.store.report_book_page(40)
        self.assertEqual(self.store.book()["reported_page"], 40)
        self.assertNotIn("fiction_page", self.store.book())

    def test_catalog_requires_inspection_and_verified_podcast(self):
        validate_catalog(CATALOG)
        self.assertTrue(CATALOG["candidates"][0]["url"].startswith("https://"))
        self.assertTrue(CATALOG["candidates"][0]["provenance"])
        bad = {**CATALOG, "candidates": [{**CATALOG["candidates"][0], "podcast_verified": False}]}
        with self.assertRaises(ValueError):
            validate_catalog(bad)
        wrong_type = {**CATALOG, "candidates": [{**CATALOG["candidates"][0], "podcast_verified": "false"}]}
        with self.assertRaises(ValueError):
            validate_catalog(wrong_type)


class CatalogRefreshTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.source = Path(self.dir.name) / "inspection.txt"
        self.source.write_text("alpha evidence phrase " * 10)
        self.manifest = {
            "book": BOOK,
            "candidates": [
                {
                    **CATALOG["candidates"][0],
                    "inspection": {
                        "source_path": str(self.source),
                        "minimum_words": 10,
                        "evidence_terms": ["alpha", "evidence phrase"],
                    },
                }
            ],
        }

    def tearDown(self):
        self.dir.cleanup()

    def test_manifest_content_link_and_recipe_validation(self):
        catalog = validate_manifest(self.manifest, url_checker=lambda url: url.startswith("https://"))
        self.assertNotIn("inspection", catalog["candidates"][0])
        with self.assertRaises(ValueError):
            validate_manifest(self.manifest, url_checker=lambda _: False)

    def test_manifest_rejects_missing_evidence_and_schema(self):
        bad = {
            **self.manifest,
            "candidates": [
                {
                    **self.manifest["candidates"][0],
                    "inspection": {**self.manifest["candidates"][0]["inspection"], "evidence_terms": ["absent"]},
                }
            ],
        }
        with self.assertRaises(ValueError):
            validate_manifest(bad, url_checker=lambda _: True)
        with self.assertRaises(ValueError):
            validate_manifest({"candidates": []})

    def test_failed_refresh_preserves_existing_catalog(self):
        manifest_path = Path(self.dir.name) / "manifest.json"
        catalog_path = Path(self.dir.name) / "catalog.json"
        catalog_path.write_text('{"old":"catalog"}')
        broken = {
            **self.manifest,
            "candidates": [
                {
                    **self.manifest["candidates"][0],
                    "inspection": {**self.manifest["candidates"][0]["inspection"], "evidence_terms": ["absent"]},
                }
            ],
        }
        manifest_path.write_text(json.dumps(broken))
        with self.assertRaises(ValueError):
            refresh_catalog(str(manifest_path), str(catalog_path), url_checker=lambda _: True)
        self.assertEqual(catalog_path.read_text(), '{"old":"catalog"}')
