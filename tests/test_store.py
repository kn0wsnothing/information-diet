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
            "url": "https://www.youtube.com/watch?v=video-1",
            "reader_url": "https://read.readwise.io/read/video-1",
            "source_url": "https://www.youtube.com/watch?v=video-1",
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
            "url": "https://www.youtube.com/watch?v=video-2",
            "reader_url": "https://read.readwise.io/read/video-2",
            "source_url": "https://www.youtube.com/watch?v=video-2",
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
        {
            "id": "read-2",
            "kind": "read",
            "title": "A second inspected read",
            "summary": "Another content summary.",
            "why": "Another reason.",
            "url": "https://example.test/read-2",
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

    def test_refresh_keeps_native_watch_link_without_resetting_progress(self):
        unsaved_video = {
            **CATALOG["candidates"][0],
            "url": CATALOG["candidates"][0]["source_url"],
            "reader_url": None,
        }
        unsaved_catalog = {**CATALOG, "candidates": [unsaved_video, *CATALOG["candidates"][1:]]}
        self.store.generate("2026-09-14", unsaved_catalog, "now")
        self.store.feedback(1, "continue", video_timestamp="0:12:00", now="one")

        self.assertFalse(self.store.generate("2026-09-14", CATALOG, "two", refresh=True))
        pick = self.store.get_list("2026-09-14")["picks"][0]
        self.assertEqual(pick["url"], CATALOG["candidates"][0]["source_url"])
        self.assertEqual(pick["state"], "continue")
        self.assertEqual(pick["last_video_timestamp"], "0:12:00")

    def test_unanswered_video_carries_without_becoming_backlog(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        reordered = {
            **CATALOG,
            "candidates": [CATALOG["candidates"][1], CATALOG["candidates"][0], CATALOG["candidates"][2]],
        }
        self.store.generate("2026-09-15", reordered, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][0]["candidate_id"], "video-1")

    def test_unanswered_short_read_carries_in_its_slot(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][1]["candidate_id"], "read-1")

    def test_historical_generation_ignores_future_carries(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(1, "continue", video_timestamp="0:10:00", now="now")
        self.store.generate("2026-09-16", CATALOG, "now")
        self.store.generate("2026-09-15", CATALOG, "now")
        historical = self.store.get_list("2026-09-15")["picks"][0]
        self.assertEqual(historical["candidate_id"], "video-1")
        self.assertEqual(historical["last_video_timestamp"], "0:10:00")

    def test_continue_short_read_carries_in_its_slot(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(2, "continue", now="now")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][1]["candidate_id"], "read-1")

    def test_resolved_short_read_does_not_carry(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(2, "completed", now="now")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][1]["candidate_id"], "read-2")

    def test_not_started_short_read_can_change_without_dislike(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(2, "not_started", now="now")
        self.store.generate("2026-09-15", CATALOG, "now")
        self.assertEqual(self.store.get_list("2026-09-15")["picks"][1]["candidate_id"], "read-2")

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
        youtube = {**CATALOG, "candidates": [{**CATALOG["candidates"][0], "url": "https://youtube.com/watch?v=no"}]}
        with self.assertRaises(ValueError):
            validate_catalog(youtube)
        vimeo = {
            **CATALOG,
            "candidates": [
                {
                    **CATALOG["candidates"][0],
                    "url": "https://vimeo.com/123",
                    "source_url": "https://vimeo.com/123",
                }
            ],
        }
        with self.assertRaises(ValueError):
            validate_catalog(vimeo)
        unsaved = {
            **CATALOG,
            "candidates": [
                {**CATALOG["candidates"][0], "url": CATALOG["candidates"][0]["source_url"], "reader_url": None}
            ],
        }
        validate_catalog(unsaved)

    def test_video_note_persists_without_changing_recommendations(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        before = self.store.get_list("2026-09-14")
        self.store.save_video_note(1, "video-1", "A useful idea", "now")
        reopened = Store(self.db)
        after = reopened.get_list("2026-09-14")
        self.assertEqual(after["picks"][0]["note_history"][0]["note"], "A useful idea")
        self.assertEqual(after["picks"][0]["state"], before["picks"][0]["state"])
        self.assertEqual(after["picks"][1]["candidate_id"], before["picks"][1]["candidate_id"])
        with sqlite3.connect(self.db) as connection:
            self.assertEqual(connection.execute("SELECT count(*) FROM feedback").fetchone()[0], 0)

    def test_video_note_history_is_newest_first_and_candidate_scoped(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.save_video_note(1, "video-1", "First note", "2026-09-14T10:00:00+08:00")
        self.store.save_video_note(1, "video-1", "Second note", "2026-09-14T11:00:00+08:00")
        self.store.generate("2026-09-15", CATALOG, "now")
        carried = self.store.get_list("2026-09-15")["picks"][0]
        self.assertEqual([entry["note"] for entry in carried["note_history"]], ["Second note", "First note"])

    def test_video_note_follows_a_carried_video_and_blank_is_rejected(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.save_video_note(1, "video-1", "Carry this idea", "one")
        self.store.feedback(1, "continue", now="two", expected_candidate_id="video-1")
        self.store.generate("2026-09-15", CATALOG, "three")
        carried = self.store.get_list("2026-09-15")["picks"][0]
        self.assertEqual(carried["candidate_id"], "video-1")
        self.assertEqual(carried["note_history"][0]["note"], "Carry this idea")
        with self.assertRaises(ValueError):
            self.store.save_video_note(carried["id"], "video-1", "", "four")
        self.assertEqual(
            [entry["note"] for entry in self.store.get_list("2026-09-15")["picks"][0]["note_history"]],
            ["Carry this idea"],
        )

    def test_stale_video_note_is_rejected(self):
        self.store.generate("2026-09-14", CATALOG, "now")
        self.store.feedback(1, "not_started", now="one", expected_candidate_id="video-1")
        self.store.generate("2026-09-14", CATALOG, "two", refresh=True)
        with self.assertRaises(ValueError):
            self.store.save_video_note(1, "video-1", "stale", "three")

    def test_snipd_route_is_persistent_and_honest(self):
        show = "https://share.snipd.com/show/synthetic"
        catalog = {
            **CATALOG,
            "candidates": [
                {**CATALOG["candidates"][0], "snipd_url": show, "snipd_direct": False},
                *CATALOG["candidates"][1:],
            ],
        }
        validate_catalog(catalog)
        self.store.generate("2026-09-14", catalog, "now")
        self.assertEqual(self.store.get_list("2026-09-14")["picks"][0]["snipd_url"], show)
        self.assertFalse(self.store.get_list("2026-09-14")["picks"][0]["snipd_direct"])

    def test_snipd_direct_requires_an_exact_episode_share_url(self):
        invalid_direct = {
            **CATALOG,
            "candidates": [
                {
                    **CATALOG["candidates"][0],
                    "snipd_url": "https://share.snipd.com/show/synthetic",
                    "snipd_direct": True,
                }
            ],
        }
        with self.assertRaises(ValueError):
            validate_catalog(invalid_direct)
        invalid_host = {
            **CATALOG,
            "candidates": [
                {
                    **CATALOG["candidates"][0],
                    "snipd_url": "https://example.com/episode/synthetic",
                    "snipd_direct": True,
                }
            ],
        }
        with self.assertRaises(ValueError):
            validate_catalog(invalid_host)


class LegacySchemaMigrationTests(unittest.TestCase):
    def test_setup_preserves_existing_runtime_state(self):
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "legacy.sqlite3"
            with sqlite3.connect(database) as connection:
                connection.executescript(
                    """
                    CREATE TABLE daily_lists (
                      date TEXT PRIMARY KEY, created_at TEXT NOT NULL, status TEXT NOT NULL,
                      source_status TEXT NOT NULL, source_message TEXT, book_target INTEGER
                    );
                    CREATE TABLE picks (
                      id INTEGER PRIMARY KEY, list_date TEXT NOT NULL REFERENCES daily_lists(date),
                      slot TEXT NOT NULL, candidate_id TEXT, title TEXT NOT NULL, kind TEXT NOT NULL,
                      summary TEXT, why TEXT, url TEXT, duration_minutes INTEGER, podcast_url TEXT,
                      podcast_verified INTEGER NOT NULL DEFAULT 0, stopping_point TEXT, provenance TEXT,
                      inspection_method TEXT, inspected_at TEXT, state TEXT NOT NULL DEFAULT 'active',
                      last_video_timestamp TEXT, UNIQUE(list_date, slot)
                    );
                    CREATE TABLE feedback (
                      id INTEGER PRIMARY KEY, pick_id INTEGER NOT NULL REFERENCES picks(id),
                      disposition TEXT NOT NULL, candidate_id TEXT, reason TEXT, video_timestamp TEXT,
                      book_page INTEGER, created_at TEXT NOT NULL
                    );
                    CREATE TABLE books (
                      id INTEGER PRIMARY KEY CHECK(id=1), nonfiction_title TEXT NOT NULL, author TEXT,
                      total_pages INTEGER, reported_page INTEGER NOT NULL, daily_pace INTEGER NOT NULL,
                      fiction_title TEXT
                    );
                    INSERT INTO daily_lists VALUES ('2026-09-14','then','ready','ok',NULL,53);
                    INSERT INTO picks VALUES (1,'2026-09-14','lunch','video-1','Video','video',NULL,NULL,
                      'https://www.youtube.com/watch?v=video-1',97,NULL,0,NULL,NULL,NULL,NULL,'continue','0:12:00');
                    INSERT INTO feedback VALUES (1,1,'continue','video-1','good','0:12:00',NULL,'then');
                    INSERT INTO books VALUES (1,'Book','Author',385,46,7,'Fiction');
                    """
                )

            Store(database).setup()

            with sqlite3.connect(database) as connection:
                connection.row_factory = sqlite3.Row
                pick = connection.execute("SELECT * FROM picks WHERE id=1").fetchone()
                feedback = connection.execute("SELECT * FROM feedback WHERE id=1").fetchone()
                book = connection.execute("SELECT * FROM books WHERE id=1").fetchone()
                self.assertEqual(pick["candidate_id"], "video-1")
                self.assertEqual(pick["state"], "continue")
                self.assertEqual(pick["last_video_timestamp"], "0:12:00")
                self.assertIsNone(pick["snipd_url"])
                self.assertEqual(pick["snipd_direct"], 0)
                self.assertEqual(feedback["reason"], "good")
                self.assertEqual(book["reported_page"], 46)
                self.assertIsNotNone(
                    connection.execute(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name='video_notes'"
                    ).fetchone()
                )


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
        checked = []
        catalog = validate_manifest(
            self.manifest, url_checker=lambda url: checked.append(url) or url.startswith("https://")
        )
        self.assertNotIn("inspection", catalog["candidates"][0])
        self.assertIn(catalog["candidates"][0]["url"], checked)
        self.assertIn(catalog["candidates"][0]["source_url"], checked)
        with self.assertRaises(ValueError):
            validate_manifest(self.manifest, url_checker=lambda _: False)

        read_manifest = {
            "book": BOOK,
            "candidates": [
                {
                    **CATALOG["candidates"][2],
                    "inspection": self.manifest["candidates"][0]["inspection"],
                }
            ],
        }
        read_checked = []
        validate_manifest(read_manifest, url_checker=lambda url: read_checked.append(url) or True)
        self.assertEqual(read_checked, [CATALOG["candidates"][2]["url"]])

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
