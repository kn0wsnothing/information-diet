import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException

import app.main as web
from app.store import Store

BOOK = {
    "nonfiction_title": "Synthetic nonfiction",
    "reported_page": 10,
    "daily_pace": 3,
    "fiction_title": "Synthetic fiction",
}
CANDIDATE = {
    "kind": "video",
    "summary": "Inspected content summary.",
    "why": "A useful reason.",
    "url": "https://example.test/video",
    "duration_minutes": 20,
    "inspection_method": "synthetic transcript",
    "inspected_at": "2026-09-14T00:00:00+08:00",
    "provenance": "synthetic fixture",
}
CATALOG = {
    "book": BOOK,
    "candidates": [
        {**CANDIDATE, "id": "video-1", "title": "First video"},
        {**CANDIDATE, "id": "video-2", "title": "Second video", "url": "https://example.test/video-2"},
    ],
}


class WebTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.old_db = web.DB_PATH
        self.old_csrf = web.CSRF_TOKEN
        self.old_hkt_date = web.hkt_date
        web.DB_PATH = str(Path(self.directory.name) / "state.sqlite3")
        web.CSRF_TOKEN = "test-token"
        web.hkt_date = lambda: "2026-09-14"
        self.store = Store(web.DB_PATH)
        self.store.setup()
        self.store.seed_books(BOOK)
        self.store.generate("2026-09-14", CATALOG, "now")

    def tearDown(self):
        web.DB_PATH = self.old_db
        web.CSRF_TOKEN = self.old_csrf
        web.hkt_date = self.old_hkt_date
        self.directory.cleanup()

    def test_stale_form_is_rejected_before_mutation(self):
        template = (Path(web.ROOT) / "templates" / "home.html").read_text()
        self.assertIn('name="candidate_id" value="{{ pick.candidate_id }}"', template)

        self.store.feedback(1, "not_started", now="one", expected_candidate_id="video-1")
        self.store.generate("2026-09-14", CATALOG, "two", refresh=True)
        with self.assertRaises(HTTPException) as raised:
            web.submit_feedback(
                pick_id=1,
                disposition="completed",
                reason="",
                video_timestamp="",
                book_page="",
                candidate_id="video-1",
                csrf_token="test-token",
            )

        self.assertEqual(raised.exception.status_code, 400)
        pick = self.store.get_list("2026-09-14")["picks"][0]
        self.assertEqual(pick["candidate_id"], "video-2")
        self.assertEqual(pick["state"], "active")
